-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    department TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tickets_email_idx ON public.tickets(email_address);
CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON public.tickets(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read access" ON public.tickets;
DROP POLICY IF EXISTS "Allow public insert access" ON public.tickets;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.tickets;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
    ON public.tickets FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert access for all users" 
    ON public.tickets FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
    ON public.tickets FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 