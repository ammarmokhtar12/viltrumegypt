-- Migration: Add order admin features
-- Run this in your Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS replacement_note TEXT DEFAULT NULL;
