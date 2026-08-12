-- Create the ebooks storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ebooks',
  'ebooks',
  false,
  52428800, -- 50MB in bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to upload files (for admin uploads)
CREATE POLICY "service_role_can_upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'ebooks');

-- Allow service role to delete files (for rollback)
CREATE POLICY "service_role_can_delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'ebooks');
