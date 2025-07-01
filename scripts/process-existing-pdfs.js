const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = 'https://pfmoazqzyfjakxljnqln.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbW9henF6eWZqYWt4bGpucWxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU5OTk1NCwiZXhwIjoyMDU5MTc1OTU0fQ.erFXcfD26GzK5_Wn03t-ygsSL3vJBS9hpx4TqX1Gkpo';
const supabase = createClient(supabaseUrl, supabaseKey);

const pdfFiles = [
  {
    title: 'FAQ LPU.pdf',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//FAQ%20LPU.pdf',
    description: 'Frequently Asked Questions about LPU'
  },
  {
    title: 'FRESHMEN-TUITION-FEE-2425-05-16-24.pdf',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//FRESHMEN-TUITION-FEE-2425-05-16-24.pdf',
    description: 'Tuition Fee Information for Freshmen 2024-2025'
  },
  {
    title: 'GSC-STUDENT-HANDBOOK-2024.pdf',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//GSC-STUDENT-HANDBOOK-2024.pdf',
    description: 'Student Handbook for Graduate School Center 2024'
  },
  {
    title: 'LPU-College-Flyer-2025.pdf',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//LPU-College-Flyer-2025.pdf',
    description: 'LPU College Programs and Information Flyer 2025'
  },
  {
    title: 'Student-Discipline-Guidebook-2023.pdf',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//Student-Discipline-Guidebook-2023.pdf',
    description: 'Student Discipline Guidelines and Policies 2023'
  }
];

async function processPDF(pdfInfo) {
  try {
    console.log(`\nProcessing ${pdfInfo.title}...`);
    
    // Store in database with description as content
    console.log('Storing in database...');
    const { data, error } = await supabase
      .from('pdf_documents')
      .insert({
        title: pdfInfo.title,
        content: pdfInfo.description,
        url: pdfInfo.url,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Success!');
    console.log('Title:', data.title);
    console.log('URL:', data.url);
    console.log('Description:', data.content);
    console.log('-'.repeat(80));

    return data;
  } catch (error) {
    console.error(`Error processing ${pdfInfo.title}:`, error);
    return null;
  }
}

async function processAllPDFs() {
  console.log('Starting to process PDFs...');
  
  for (const pdfInfo of pdfFiles) {
    await processPDF(pdfInfo);
  }

  console.log('\nAll PDFs processed!');
  console.log('\nYou can view all PDFs by running: node scripts/view-pdfs.js');
}

// Process all PDFs
processAllPDFs(); 