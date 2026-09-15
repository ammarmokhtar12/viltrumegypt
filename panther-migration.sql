-- ================================================
-- Panther Express Integration — Database Migration
-- Run this in Supabase SQL Editor
-- ================================================

-- Add shipping status columns for Panther webhook updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_status_ar'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_status_ar TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_status_en'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_status_en TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_status_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_status_id TEXT;
  END IF;
END $$;
