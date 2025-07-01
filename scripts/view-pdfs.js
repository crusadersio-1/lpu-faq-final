const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pfmoazqzyfjakxljnqln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbW9henF6eWZqYWt4bGpucWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU5OTk1NCwiZXhwIjoyMDU5MTc1OTU0fQ.erFXcfD26GzK5_Wn03t-ygsSL3vJBS9hpx4TqX1Gkpo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function viewPDFs() {
  try {
    // Get all PDFs ordered by most recent first
    const { data, error } = await supabase
      .from('pdf_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('No PDFs found in the database');
      return;
    }

    console.log(`Found ${data.length} PDF(s):\n`);

    data.forEach((pdf, index) => {
      console.log(`PDF #${index + 1}:`);
      console.log('Title:', pdf.title);
      console.log('URL:', pdf.url);
      console.log('Upload Date:', new Date(pdf.created_at).toLocaleString());
      console.log('Content Preview:', pdf.content.substring(0, 200) + '...');
      console.log('Content Length:', pdf.content.length, 'characters');
      console.log('-'.repeat(80) + '\n');
    });

  } catch (error) {
    console.error('Error viewing PDFs:', error);
  }
}

// View the PDFs
viewPDFs(); 