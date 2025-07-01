import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@lpu.edu.ph',
    password: 'Admin@123',
    email_confirm: true,
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
    return;
  }

  console.log('Admin user created successfully:', data);
}

createAdminUser(); 