-- ================================================
-- VILTRUM COMMAND CENTER — "How Much" Treasury System
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. How Much Settings (Initial Balances & Preferences)
CREATE TABLE IF NOT EXISTS how_much_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ammar_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  mohamed_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  auto_sync_orders BOOLEAN NOT NULL DEFAULT false,
  auto_sync_expenses BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if not exists (Both start at 0, manual additions)
INSERT INTO how_much_settings (id, ammar_initial_balance, mohamed_initial_balance, auto_sync_orders, auto_sync_expenses)
VALUES ('default', 0, 0, false, false)
ON CONFLICT (id) DO UPDATE SET
  ammar_initial_balance = EXCLUDED.ammar_initial_balance,
  mohamed_initial_balance = EXCLUDED.mohamed_initial_balance,
  auto_sync_orders = EXCLUDED.auto_sync_orders,
  auto_sync_expenses = EXCLUDED.auto_sync_expenses;

-- 2. How Much Transactions (Ledger for Ammar & Mohamed)
CREATE TABLE IF NOT EXISTS how_much_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('ammar', 'mohamed')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE how_much_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE how_much_transactions ENABLE ROW LEVEL SECURITY;

-- Allow service role and anon access (App-level admin authentication)
DROP POLICY IF EXISTS "Anon full access settings" ON how_much_settings;
DROP POLICY IF EXISTS "Anon full access transactions" ON how_much_transactions;
DROP POLICY IF EXISTS "Service full access settings" ON how_much_settings;
DROP POLICY IF EXISTS "Service full access transactions" ON how_much_transactions;

CREATE POLICY "Anon full access settings" ON how_much_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access transactions" ON how_much_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Service full access settings" ON how_much_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access transactions" ON how_much_transactions FOR ALL USING (true) WITH CHECK (true);
