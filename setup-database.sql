-- Enable full text search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create PDF documents table
CREATE TABLE IF NOT EXISTS public.pdf_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_message TEXT NOT NULL,
    bot_message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create full text search indexes
CREATE INDEX IF NOT EXISTS faq_question_search_idx ON public.faqs USING GIN (question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pdf_content_search_idx ON public.pdf_documents USING GIN (content gin_trgm_ops);

-- Grant necessary permissions
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.faqs
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.pdf_documents
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.conversations
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Enable full access for authenticated users" ON public.faqs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable full access for authenticated users" ON public.pdf_documents
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable full access for authenticated users" ON public.conversations
    FOR ALL USING (auth.role() = 'authenticated');

-- Upload PDF using the command line script
node scripts/upload-pdf.js "path/to/your/pdf/file.pdf"