-- Add shipping_company column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_company TEXT DEFAULT 'alsafwa';
