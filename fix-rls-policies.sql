-- ====================================================================
-- VILTRUM EGYPT — RLS FIX for Expenses & Inventory
-- Run this in: https://supabase.com/dashboard → SQL Editor
-- ====================================================================

-- ---- EXPENSES TABLE ----
-- Make sure the table exists first
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop old policies and recreate
DROP POLICY IF EXISTS "Public can select expenses" ON expenses;
DROP POLICY IF EXISTS "Public can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Anon full access on expenses" ON expenses;

CREATE POLICY "Anon full access on expenses"
  ON expenses FOR ALL
  USING (true)
  WITH CHECK (true);


-- ---- INVENTORY TABLE ----
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Drop old policies and recreate
DROP POLICY IF EXISTS "Public can select inventory" ON inventory;
DROP POLICY IF EXISTS "Public can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users manage inventory" ON inventory;
DROP POLICY IF EXISTS "Anon full access on inventory" ON inventory;

CREATE POLICY "Anon full access on inventory"
  ON inventory FOR ALL
  USING (true)
  WITH CHECK (true);


-- ---- PRODUCTS TABLE (just in case) ----
DROP POLICY IF EXISTS "Anon full access on products" ON products;
CREATE POLICY "Anon full access on products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);


-- Done! Test adding expenses and modifying inventory now.
