-- ==========================================
-- VILTRUM EGYPT — CRITICAL SECURITY FIXES
-- Run this in your Supabase SQL Editor immediately
-- ==========================================

-- 1. DROP OLD DANGEROUS POLICIES
DROP POLICY IF EXISTS "Anon full access on products" ON products;
DROP POLICY IF EXISTS "Anon full access on orders" ON orders;

-- 2. SECURE PRODUCTS TABLE
-- Anyone can read active products (already exists, but we make sure)
-- Only authenticated users (Admin) can insert, update, delete products
CREATE POLICY "Authenticated users manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. SECURE ORDERS TABLE
-- Anyone can insert an order (when a customer checks out)
-- (The existing "Anyone can insert orders" policy covers this)

-- Only authenticated users (Admin) can read, update, delete orders
CREATE POLICY "Authenticated users select orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- 4. SECURE STORAGE BUCKETS (PRODUCT IMAGES)
-- Drop old dangerous policies
DROP POLICY IF EXISTS "Allow public uploads for product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update/delete for product images" ON storage.objects;

-- Only authenticated users can upload product images
CREATE POLICY "Authenticated upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Only authenticated users can update/delete product images
CREATE POLICY "Authenticated manage product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Note: The read policy ("Allow public reads for product images") is kept so customers can see images.
