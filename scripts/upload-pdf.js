const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist');

// Configure PDF.js worker
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractPDFContent(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjs.getDocument({ data }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw error;
  }
}

async function uploadPDF(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    
    // Extract text content from PDF
    console.log('Extracting PDF content...');
    const pdfContent = await extractPDFContent(filePath);

    // Upload PDF to Storage
    console.log('Uploading PDF to storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(`${Date.now()}-${fileName}`, fileData, {
        contentType: 'application/pdf',
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(uploadData.path);

    // Store PDF metadata and content in database
    console.log('Storing PDF metadata in database...');
    const { data, error: dbError } = await supabase
      .from('pdf_documents')
      .insert({
        title: fileName,
        content: pdfContent,
        url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log('\nPDF uploaded successfully!');
    console.log('Title:', data.title);
    console.log('URL:', data.url);
    console.log('Content length:', data.content.length, 'characters');
    console.log('\nYou can view all uploaded PDFs by running: node scripts/view-pdfs.js');

  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a PDF file path');
  console.error('Usage: node scripts/upload-pdf.js "path/to/your/pdf/file.pdf"');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

// Upload the PDF
uploadPDF(filePath)
  .catch((error) => {
    console.error('Failed to upload PDF:', error);
    process.exit(1);
  }); 