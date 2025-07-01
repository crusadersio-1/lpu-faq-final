-- Create admin profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admins to view all profiles"
    ON public.admin_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to update their own profile"
    ON public.admin_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create function to handle admin profile creation
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new admin creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin();

-- Insert initial admin user if not exists
INSERT INTO public.admin_profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name',
    'super_admin'
FROM auth.users 
WHERE email = 'admin@lpu.edu.ph'
ON CONFLICT (id) DO NOTHING; 