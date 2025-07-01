const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pfmoazqzyfjakxljnqln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbW9henF6eWZqYWt4bGpucWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU5OTk1NCwiZXhwIjoyMDU5MTc1OTU0fQ.erFXcfD26GzK5_Wn03t-ygsSL3vJBS9hpx4TqX1Gkpo';
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