-- =========================================================
-- VILTRUM EGYPT — Add Arrive Shipping columns to Replacements
-- Run this in your Supabase SQL Editor
-- =========================================================

ALTER TABLE replacements ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT NULL;
ALTER TABLE replacements ADD COLUMN IF NOT EXISTS shipping_company TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_replacements_tracking_number ON replacements(tracking_number);
