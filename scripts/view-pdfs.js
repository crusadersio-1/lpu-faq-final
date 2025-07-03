const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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