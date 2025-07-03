const { createClient } = require('@supabase/supabase-js');
const pdf = require('pdf-parse');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

async function processPDF(pdfDoc) {
  try {
    console.log(`\nProcessing ${pdfDoc.title}...`);
    
    // Download PDF
    console.log('Downloading PDF...');
    const response = await fetch(pdfDoc.url);
    const buffer = await response.buffer();
    
    // Extract text
    console.log('Extracting text...');
    const content = await extractTextFromPDF(buffer);
    
    // Update database
    console.log('Updating database...');
    const { error } = await supabase
      .from('pdf_documents')
      .update({
        content: content
      })
      .eq('id', pdfDoc.id);
      
    if (error) throw error;
    
    console.log('Successfully processed!');
    console.log(`Content length: ${content.length} characters`);
    console.log('-'.repeat(80));
    
    return content;
  } catch (error) {
    console.error(`Error processing ${pdfDoc.title}:`, error);
    return null;
  }
}

async function processAllPDFs() {
  try {
    console.log('Starting PDF content extraction...');
    
    // Get all PDFs
    const { data: pdfs, error } = await supabase
      .from('pdf_documents')
      .select('*');
      
    if (error) throw error;
    
    console.log(`Found ${pdfs.length} PDFs to process`);
    
    // Process each PDF
    for (const pdf of pdfs) {
      await processPDF(pdf);
    }
    
    console.log('\nAll PDFs processed successfully!');
  } catch (error) {
    console.error('Error processing PDFs:', error);
  }
}

processAllPDFs(); 