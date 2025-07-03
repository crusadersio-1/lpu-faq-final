const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPDFs() {
  try {
    console.log('Starting cleanup...');

    // Get all PDF documents from database
    const { data: allFiles, error: fetchError } = await supabase
      .from('pdf_documents')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Group files by title
    const fileGroups = {};
    allFiles.forEach(file => {
      if (!fileGroups[file.title]) {
        fileGroups[file.title] = [];
      }
      fileGroups[file.title].push(file);
    });

    // Keep only the latest version of each file
    for (const [title, files] of Object.entries(fileGroups)) {
      if (files.length > 1) {
        console.log(`Found ${files.length} copies of ${title}, removing duplicates...`);
        
        // Sort by created_at in descending order
        files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Keep the first (latest) one, delete the rest
        const toDelete = files.slice(1);
        
        for (const file of toDelete) {
          const { error: deleteError } = await supabase
            .from('pdf_documents')
            .delete()
            .eq('id', file.id);
            
          if (deleteError) {
            console.error(`Error deleting duplicate of ${title}:`, deleteError);
          } else {
            console.log(`Deleted duplicate of ${title} (ID: ${file.id})`);
          }
        }
      }
    }

    console.log('\nCleanup completed!');
    console.log('\nCurrent database state:');
    
    // Show final state
    const { data: finalFiles, error: finalError } = await supabase
      .from('pdf_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) throw finalError;

    finalFiles.forEach(file => {
      console.log(`\nTitle: ${file.title}`);
      console.log(`URL: ${file.url}`);
      console.log(`Content: ${file.content}`);
      console.log(`Created: ${new Date(file.created_at).toLocaleString()}`);
      console.log('-'.repeat(80));
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupPDFs(); 