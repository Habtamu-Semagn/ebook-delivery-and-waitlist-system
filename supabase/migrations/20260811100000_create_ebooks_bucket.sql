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

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'service_role_can_upload'
  ) THEN
    CREATE POLICY "service_role_can_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'ebooks');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'service_role_can_delete'
  ) THEN
    CREATE POLICY "service_role_can_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'ebooks');
  END IF;
END $$;
