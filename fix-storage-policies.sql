-- Create the pdfs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update pdf files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pdf files" ON storage.objects;

-- Create an open policy for the pdfs bucket
CREATE POLICY "Allow public access to pdfs bucket" ON storage.objects
FOR ALL USING (bucket_id = 'pdfs');

-- Disable RLS on the pdf_documents table to allow inserts
ALTER TABLE public.pdf_documents DISABLE ROW LEVEL SECURITY;

-- Create the pdf_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on the faqs table as well
ALTER TABLE IF EXISTS public.faqs DISABLE ROW LEVEL SECURITY; 