-- ================================================
-- VILTRUM COMMAND CENTER — Database Migration
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Budget & Settings table
CREATE TABLE IF NOT EXISTS budget_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL DEFAULT 'monthly',
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  ad_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ad Spend tracking (per platform per day)
CREATE TABLE IF NOT EXISTS ad_spend (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'other')),
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  cpm NUMERIC(8,2) DEFAULT 0,
  cpc NUMERIC(8,2) DEFAULT 0,
  ctr NUMERIC(6,4) DEFAULT 0,
  campaign_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Manufacturing batches
CREATE TABLE IF NOT EXISTS manufacturing_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  fabric_cost NUMERIC(10,2) DEFAULT 0,
  printing_cost NUMERIC(10,2) DEFAULT 0,
  sewing_cost NUMERIC(10,2) DEFAULT 0,
  packaging_cost NUMERIC(10,2) DEFAULT 0,
  transport_cost NUMERIC(10,2) DEFAULT 0,
  other_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (
    fabric_cost + printing_cost + sewing_cost + packaging_cost + transport_cost + other_cost
  ) STORED,
  cost_per_unit NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN quantity_produced > 0
      THEN (fabric_cost + printing_cost + sewing_cost + packaging_cost + transport_cost + other_cost) / quantity_produced
      ELSE 0
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  order_number INTEGER,
  reason TEXT NOT NULL CHECK (reason IN ('defective', 'wrong_size', 'wrong_item', 'not_as_described', 'changed_mind', 'other')),
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'exchanged')),
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_method TEXT CHECK (refund_method IN ('vodafone_cash', 'instapay', 'store_credit', 'exchange', NULL)),
  refund_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add payment_collected to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_collected'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_collected BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 6. Add shipping_company and tracking_number to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_company'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_company TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON budget_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ad_spend FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON manufacturing_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON returns FOR ALL USING (true) WITH CHECK (true);

-- Allow anon read/write (since admin auth is app-level)
CREATE POLICY "Anon full access" ON budget_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON ad_spend FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON manufacturing_batches FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON returns FOR ALL TO anon USING (true) WITH CHECK (true);
