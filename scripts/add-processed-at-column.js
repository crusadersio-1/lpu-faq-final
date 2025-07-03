const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addProcessedAtColumn() {
  try {
    console.log('Adding processed_at column to pdf_documents table...');
    
    // Add the column if it doesn't exist
    const { error } = await supabase.rpc('add_processed_at_column');
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Column already exists, skipping...');
      } else {
        throw error;
      }
    } else {
      console.log('Column added successfully!');
    }
  } catch (error) {
    console.error('Error adding column:', error);
  }
}

addProcessedAtColumn(); 