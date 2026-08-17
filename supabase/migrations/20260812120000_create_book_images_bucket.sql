-- Create book-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-images', 'book-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Public read access for book images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload book images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete book images" ON storage.objects;

-- Allow public read access to book images
CREATE POLICY "Public read access for book images"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-images');

-- Allow authenticated users to upload book images (for admin uploads)
CREATE POLICY "Authenticated users can upload book images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-images');

-- Allow authenticated users to delete book images
CREATE POLICY "Authenticated users can delete book images"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-images');
