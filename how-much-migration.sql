-- ================================================
-- VILTRUM COMMAND CENTER — "How Much" Treasury System
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. How Much Settings (Initial Balances & Preferences)
CREATE TABLE IF NOT EXISTS how_much_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ammar_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  mohamed_initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  auto_sync_orders BOOLEAN NOT NULL DEFAULT true,
  auto_sync_expenses BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO how_much_settings (id, ammar_initial_balance, mohamed_initial_balance, auto_sync_orders, auto_sync_expenses)
VALUES ('default', 0, 0, true, true)
ON CONFLICT (id) DO NOTHING;

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
CREATE POLICY "Anon full access settings" ON how_much_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access transactions" ON how_much_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Service full access settings" ON how_much_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full access transactions" ON how_much_transactions FOR ALL USING (true) WITH CHECK (true);
