-- ==========================================
-- VILTRUM EGYPT — Affiliate & Influencer System Schema
-- Run this in your Supabase SQL Editor to initialize
-- ==========================================

-- 1. CREATE INFLUENCERS TABLE
CREATE TABLE IF NOT EXISTS influencers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disabled')) DEFAULT 'pending',
  commission_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  clicks INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast coupon lookup
CREATE INDEX IF NOT EXISTS idx_influencers_coupon ON influencers(coupon_code);
CREATE INDEX IF NOT EXISTS idx_influencers_email ON influencers(email);

-- 2. ADD COLUMNS TO ORDERS TABLE
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL;

-- Index for orders matching
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id);

-- 3. CREATE COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  order_number INTEGER NOT NULL,
  coupon_code TEXT NOT NULL,
  order_total_before_discount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  commission_percent DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_influencer ON commissions(influencer_id);

-- 4. TRIGGERS FOR ORDER UPDATES
CREATE OR REPLACE FUNCTION handle_order_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Track delivery time
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    NEW.delivered_at = NOW();
  END IF;

  -- Sync commission status on cancellation
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    UPDATE commissions
    SET status = 'cancelled', updated_at = NOW()
    WHERE order_id = NEW.id;
  END IF;

  -- If status goes back from cancelled, we could revert commission to pending
  IF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
    UPDATE commissions
    SET status = 'pending', updated_at = NOW()
    WHERE order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_affiliate_update ON orders;
CREATE TRIGGER trg_orders_affiliate_update
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_updates();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES (Matches public accessibility model used for products/orders admin)
DROP POLICY IF EXISTS "Public full access on influencers" ON influencers;
CREATE POLICY "Public full access on influencers"
  ON influencers FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on commissions" ON commissions;
CREATE POLICY "Public full access on commissions"
  ON commissions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. ADD PASSWORD COLUMN FOR INFLUENCER LOGIN SECURE ACCESS
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT NULL;
