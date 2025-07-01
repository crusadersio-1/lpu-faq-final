-- Add extraction_successful column to pdf_documents if it doesn't exist
ALTER TABLE IF EXISTS public.pdf_documents 
ADD COLUMN IF NOT EXISTS extraction_successful BOOLEAN DEFAULT FALSE;

-- Fix the schema cache
NOTIFY pgrst, 'reload schema'; 