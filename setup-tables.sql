-- Enable full text search extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create PDF documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pdf_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create full text search index
CREATE INDEX IF NOT EXISTS pdf_content_search_idx ON public.pdf_documents USING GIN (content gin_trgm_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.pdf_documents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.pdf_documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy
CREATE POLICY "Give public access to pdfs" ON storage.objects
    FOR SELECT USING (bucket_id = 'pdfs');

CREATE POLICY "Allow authenticated users to upload pdfs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdfs' 
        AND auth.role() = 'authenticated'
    ); 