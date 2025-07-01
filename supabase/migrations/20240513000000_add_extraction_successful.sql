-- Add extraction_successful column to pdf_documents if it doesn't exist
DO $$
BEGIN
  ALTER TABLE public.pdf_documents 
  ADD COLUMN IF NOT EXISTS extraction_successful BOOLEAN DEFAULT FALSE;
EXCEPTION 
  WHEN duplicate_column THEN 
    NULL;
END $$;

-- Ensure the column exists in the schema cache
NOTIFY pgrst, 'reload schema'; 