-- Add image_url column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for review images (run in Supabase Dashboard > Storage)
-- 1. Create bucket named "review-images"
-- 2. Set it to PUBLIC
-- 3. Add policy: Allow anonymous uploads (INSERT) and public reads (SELECT)
