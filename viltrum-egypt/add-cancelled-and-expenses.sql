-- ====================================================================
-- VILTRUM EGYPT — MIGRATION: CANCELLED ORDERS & EXPENSES & RLS FIX
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. UPDATE ORDERS TABLE CONSTRAINT FOR 'cancelled' STATUS
-- We drop the existing check constraint on status and re-add it to include 'cancelled'.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'));

-- 2. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('fabric', 'pattern', 'printing', 'designer', 'transport', 'production', 'marketing', 'packaging', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS & CREATE POLICIES FOR EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select expenses" ON expenses;
DROP POLICY IF EXISTS "Public can manage expenses" ON expenses;

CREATE POLICY "Public can select expenses"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "Public can manage expenses"
  ON expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. FIX RLS POLICIES FOR INVENTORY
-- Ensure public/anon has full access to the inventory table since the admin uses anon client
DROP POLICY IF EXISTS "Public can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Authenticated users manage inventory" ON inventory;

CREATE POLICY "Public can manage inventory"
  ON inventory FOR ALL
  USING (true)
  WITH CHECK (true);