-- Drop existing columns if they exist
ALTER TABLE public.tickets
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email;

-- Add new columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS email_address TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'general';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tickets_email_address_idx ON public.tickets(email_address);
CREATE INDEX IF NOT EXISTS tickets_priority_idx ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS tickets_department_idx ON public.tickets(department);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON public.tickets;
DROP POLICY IF EXISTS "Allow public insert access" ON public.tickets;

CREATE POLICY "Allow public read access" ON public.tickets
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.tickets
    FOR INSERT WITH CHECK (true); 