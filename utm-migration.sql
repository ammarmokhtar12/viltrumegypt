-- ================================================
-- UTM Tracking — Database Migration
-- Run this in Supabase SQL Editor
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'utm_medium'
  ) THEN
    ALTER TABLE orders ADD COLUMN utm_medium TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'utm_campaign'
  ) THEN
    ALTER TABLE orders ADD COLUMN utm_campaign TEXT;
  END IF;
END $$;
