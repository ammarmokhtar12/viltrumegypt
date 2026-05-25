-- ====================================================================
-- VILTRUM EGYPT — MIGRATION: INVENTORY SYSTEM (STOCK TRACKING)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. CREATE INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  quantity INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, size)
);


-- 2. CREATE INDEXES FOR FAST RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);


-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;


-- 4. STORAGE / RLS POLICIES FOR INVENTORY
-- Drop existing policies if they exist to avoid duplication
DROP POLICY IF EXISTS "Public can select inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users manage inventory" ON inventory;

-- Create policies (Anyone can read stock levels; only authenticated admins can manage them)
CREATE POLICY "Public can select inventory"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- 5. POPULATE DEFAULT STOCK FOR EXISTING PRODUCTS
-- Cross-join products with their size arrays and insert 10 units for each size
INSERT INTO inventory (product_id, size, quantity)
SELECT p.id, s.size, 10
FROM products p
CROSS JOIN LATERAL UNNEST(p.sizes) AS s(size)
ON CONFLICT (product_id, size) DO NOTHING;


-- 6. SECURE RPC FUNCTION: DECREMENT STOCK
-- Used during customer checkout (runs bypass RLS using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_size TEXT, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  -- Insert a row if it doesn't exist, otherwise decrement quantity
  INSERT INTO inventory (product_id, size, quantity)
  VALUES (p_product_id, p_size, 0)
  ON CONFLICT (product_id, size) DO UPDATE
  SET quantity = GREATEST(0, inventory.quantity - p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. SECURE RPC FUNCTION: INCREMENT STOCK
-- Used when an admin cancels an order (restores items to inventory)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_size TEXT, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  -- Insert a row if it doesn't exist, otherwise increment quantity
  INSERT INTO inventory (product_id, size, quantity)
  VALUES (p_product_id, p_size, p_quantity)
  ON CONFLICT (product_id, size) DO UPDATE
  SET quantity = inventory.quantity + p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. SET UP UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS inventory_updated_at ON inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
