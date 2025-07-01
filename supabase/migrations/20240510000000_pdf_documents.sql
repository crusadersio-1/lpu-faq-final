-- Create pdf_documents table
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can insert pdf_documents" 
  ON public.pdf_documents FOR INSERT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update their pdf_documents" 
  ON public.pdf_documents FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Anyone can view pdf_documents" 
  ON public.pdf_documents FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for faqs
CREATE POLICY "Enable insert for authenticated users" 
  ON public.faqs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Enable select for all users" 
  ON public.faqs FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Enable update for authenticated users" 
  ON public.faqs FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Enable delete for authenticated users" 
  ON public.faqs FOR DELETE 
  TO authenticated 
  USING (true);

-- Create storage bucket for PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view pdf files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can upload pdf files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pdfs' AND (storage.extension(name) = 'pdf'));

CREATE POLICY "Authenticated users can update pdf files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can delete pdf files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pdfs'); 