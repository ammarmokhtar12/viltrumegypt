-- Add referral_source column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_source TEXT;
