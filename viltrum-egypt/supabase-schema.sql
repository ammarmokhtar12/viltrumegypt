-- ==========================================
-- VILTRUM EGYPT — Supabase SQL Schema
-- Run this in Supabase SQL Editor to initialize
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vodafone_cash', 'instapay')),
  payment_screenshot_url TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROFILES TABLE (REGISTERED USERS)
-- ==========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_active ON products(is_active);

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read active products
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Products: anon can manage products (for admin via client-side)
CREATE POLICY "Anon full access on products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders: anyone can insert (customer placing order)
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Orders: anon can read/update orders (for admin dashboard)
CREATE POLICY "Anon full access on orders"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- SUPABASE STORAGE BUCKETS
-- ==========================================

-- 1. Create Product Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Payment Screenshots Bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Allow anyone to upload new product images
CREATE POLICY "Allow public uploads for product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to read product images
CREATE POLICY "Allow public reads for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow anyone to update/delete product images (for admin edits)
CREATE POLICY "Allow public update/delete for product images"
ON storage.objects FOR ALL
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to upload payment screenshots
CREATE POLICY "Allow public uploads for payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow anyone to read payment screenshots (so admin can view them)
CREATE POLICY "Allow public reads for payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');
