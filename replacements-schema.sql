-- ==========================================
-- VILTRUM EGYPT — Replacements / Exchanges Table
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS replacements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  replacement_number SERIAL,
  original_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  original_order_number INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  -- Items the customer is returning
  returned_items JSONB NOT NULL DEFAULT '[]',
  -- New items being sent to customer
  new_items JSONB NOT NULL DEFAULT '[]',
  -- same_type = 90 EGP shipping, different_type = 150 EGP
  exchange_type TEXT NOT NULL DEFAULT 'same_type' CHECK (exchange_type IN ('same_type', 'different_type')),
  shipping_fees DECIMAL(10,2) NOT NULL DEFAULT 90,
  price_difference DECIMAL(10,2) NOT NULL DEFAULT 0,
  -- total = price_difference + shipping_fees
  total DECIMAL(10,2) NOT NULL DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger
CREATE TRIGGER replacements_updated_at
  BEFORE UPDATE ON replacements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_replacements_status ON replacements(status);
CREATE INDEX IF NOT EXISTS idx_replacements_created_at ON replacements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacements_original_order ON replacements(original_order_id);

-- RLS
ALTER TABLE replacements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access on replacements"
  ON replacements FOR ALL
  USING (true)
  WITH CHECK (true);
