const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://pfmoazqzyfjakxljnqln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbW9henF6eWZqYWt4bGpucWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU5OTk1NCwiZXhwIjoyMDU5MTc1OTU0fQ.erFXcfD26GzK5_Wn03t-ygsSL3vJBS9hpx4TqX1Gkpo';
const supabase = createClient(supabaseUrl, supabaseKey);

const expectedFiles = [
  'FAQ LPU.pdf',
  'FRESHMEN-TUITION-FEE-2425-05-16-24.pdf',
  'GSC-STUDENT-HANDBOOK-2024.pdf',
  'LPU-College-Flyer-2025.pdf',
  'Student-Discipline-Guidebook-2023.pdf'
];

async function checkPDFs() {
  try {
    console.log('Checking storage bucket...\n');

    // Get files from storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('pdf')
      .list();

    if (storageError) {
      console.error('Error accessing storage:', storageError);
    } else {
      console.log('Files in storage bucket:');
      storageFiles.forEach(file => {
        console.log(`- ${file.name}`);
      });
    }

    console.log('\nChecking database records...\n');

    // Get files from database
    const { data: dbFiles, error: dbError } = await supabase
      .from('pdf_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error accessing database:', dbError);
    } else {
      console.log('Files in database:');
      dbFiles.forEach(file => {
        console.log(`\nTitle: ${file.title}`);
        console.log(`URL: ${file.url}`);
        console.log(`Content: ${file.content}`);
        console.log(`Created: ${new Date(file.created_at).toLocaleString()}`);
        console.log('-'.repeat(80));
      });
    }

    // Verify URLs are accessible
    console.log('\nVerifying file accessibility...\n');
    for (const file of dbFiles) {
      try {
        const response = await fetch(file.url);
        if (response.ok) {
          console.log(`✓ ${file.title} is accessible`);
        } else {
          console.log(`✗ ${file.title} is not accessible (Status: ${response.status})`);
        }
      } catch (error) {
        console.log(`✗ ${file.title} is not accessible (Error: ${error.message})`);
      }
    }

  } catch (error) {
    console.error('Error during check:', error);
  }
}

// Run the check
checkPDFs(); 