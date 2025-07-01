-- Drop existing policies for pdfs bucket
DROP POLICY IF EXISTS "Authenticated users can upload pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pdf files" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "Allow full access to pdfs bucket" ON storage.objects
  FOR ALL
  USING (bucket_id = 'pdfs')
  WITH CHECK (bucket_id = 'pdfs');

-- Update pdf_documents table policies
ALTER TABLE public.pdf_documents DISABLE ROW LEVEL SECURITY;

-- Add extraction_successful column to pdf_documents if it doesn't exist
DO $$
BEGIN
  ALTER TABLE public.pdf_documents ADD COLUMN IF NOT EXISTS extraction_successful BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Ensure the pdfs bucket exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('pdfs', 'pdfs', true)
  ON CONFLICT (id) DO NOTHING;
END $$; 