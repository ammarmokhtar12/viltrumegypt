-- ================================================
-- VILTRUM EGYPT — Safwa Shipping System Migration
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Create safwa_shipments table
CREATE TABLE IF NOT EXISTS safwa_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_safwa_shipments_date ON safwa_shipments(shipment_date DESC);
CREATE INDEX IF NOT EXISTS idx_safwa_shipments_order ON safwa_shipments(order_id);

-- 3. Enable RLS
ALTER TABLE safwa_shipments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (allow anon full access since admin auth is app-level)
CREATE POLICY "Anon full access on safwa_shipments"
  ON safwa_shipments FOR ALL
  USING (true)
  WITH CHECK (true);
