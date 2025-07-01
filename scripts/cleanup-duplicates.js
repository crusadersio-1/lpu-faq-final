const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pfmoazqzyfjakxljnqln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbW9henF6eWZqYWt4bGpucWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU5OTk1NCwiZXhwIjoyMDU5MTc1OTU0fQ.erFXcfD26GzK5_Wn03t-ygsSL3vJBS9hpx4TqX1Gkpo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  try {
    console.log('Starting cleanup of duplicate PDF entries...');

    // Get all PDFs
    const { data: pdfs, error } = await supabase
      .from('pdf_documents')
      .select('*');

    if (error) throw error;

    // Group PDFs by title
    const pdfGroups = {};
    pdfs.forEach(pdf => {
      if (!pdfGroups[pdf.title]) {
        pdfGroups[pdf.title] = [];
      }
      pdfGroups[pdf.title].push(pdf);
    });

    // For each group, keep the most recent entry and delete others
    for (const [title, group] of Object.entries(pdfGroups)) {
      if (group.length > 1) {
        console.log(`\nFound ${group.length} entries for "${title}"`);
        
        // Sort by created_at, most recent first
        group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Keep the most recent entry
        const keepId = group[0].id;
        const deleteIds = group.slice(1).map(pdf => pdf.id);
        
        console.log(`Keeping entry with ID: ${keepId}`);
        console.log(`Deleting ${deleteIds.length} duplicate entries`);
        
        // Delete duplicates
        const { error: deleteError } = await supabase
          .from('pdf_documents')
          .delete()
          .in('id', deleteIds);
          
        if (deleteError) throw deleteError;
      }
    }

    console.log('\nCleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDuplicates(); 