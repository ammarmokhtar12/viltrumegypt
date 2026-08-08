-- Add shipped_at column to track when orders are shipped
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient date-based shipped queries
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at DESC);
