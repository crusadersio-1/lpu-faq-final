const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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