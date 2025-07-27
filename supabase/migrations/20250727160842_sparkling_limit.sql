/*
  # Create storage buckets for file uploads

  1. Storage Buckets
    - `test-templates` - for PDF test templates
    - `reports` - for generated report PDFs
    - `registration-slips` - for generated registration slip PDFs/images

  2. Storage Policies
    - Users can upload/read their own files
    - Public read access for sharing reports
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('test-templates', 'test-templates', false),
  ('reports', 'reports', true),
  ('registration-slips', 'registration-slips', true)
ON CONFLICT (id) DO NOTHING;

-- Test Templates Bucket Policies
CREATE POLICY "Users can upload test templates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'test-templates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own test templates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'test-templates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own test templates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'test-templates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own test templates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'test-templates' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reports Bucket Policies (public read for sharing)
CREATE POLICY "Users can upload reports"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read reports"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'reports');

CREATE POLICY "Users can delete own reports"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Registration Slips Bucket Policies (public read for sharing)
CREATE POLICY "Users can upload registration slips"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'registration-slips' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read registration slips"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'registration-slips');

CREATE POLICY "Users can delete own registration slips"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'registration-slips' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );