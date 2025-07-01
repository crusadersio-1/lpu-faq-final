import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import pdf from 'pdf-parse';

// Force dynamic route and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

interface PDFInfo {
  title: string;
  url: string;
}

interface PDFFiles {
  [key: string]: PDFInfo;
}

// PDF file mappings with their storage URLs
const PDF_FILES: PDFFiles = {
  'FAQ LPU.pdf': {
    title: 'General FAQ Document',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf/FAQ%20LPU.pdf'
  },
  'FRESHMEN-TUITION-FEE-2425-05-16-24.pdf': {
    title: 'Freshmen Tuition Fee Information 2024-2025',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf/FRESHMEN-TUITION-FEE-2425-05-16-24.pdf'
  },
  'GSC-STUDENT-HANDBOOK-2024.pdf': {
    title: 'Student Handbook 2024',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf/GSC-STUDENT-HANDBOOK-2024.pdf'
  },
  'LPU-College-Flyer-2025.pdf': {
    title: 'College Programs Flyer 2025',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf/LPU-College-Flyer-2025.pdf'
  },
  'Student-Discipline-Guidebook-2023.pdf': {
    title: 'Student Discipline Guidelines 2023',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf/Student-Discipline-Guidebook-2023.pdf'
  }
};

interface PDFParseOptions {
  max?: number;
  version?: string;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    const data = await pdf(buffer);
    
    if (!data || !data.text) {
      throw new Error('No text content found in PDF');
    }

    console.log(`Raw text length: ${data.text.length} characters`);
    
    // Clean and normalize the text
    let cleanedText = data.text
      // Replace multiple spaces, newlines, and tabs with a single space
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Replace special characters with space (except common punctuation)
      .replace(/[^\w\s.,?!:;()\[\]{}'"]/g, ' ')
      // Normalize quotes and apostrophes
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      // Trim whitespace
      .trim();

    // Split into sentences and clean each sentence
    const sentences = cleanedText
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => {
        // Remove empty or invalid sentences
        if (!sentence) return false;
        if (sentence.length < 3) return false;
        // Must contain at least one letter
        if (!/[a-zA-Z]/.test(sentence)) return false;
        return true;
      })
      .map(sentence => {
        // Ensure sentence ends with proper punctuation
        if (!/[.!?]$/.test(sentence)) {
          return sentence + '.';
        }
        return sentence;
      });

    if (sentences.length === 0) {
      throw new Error('No valid sentences found after processing');
    }

    // Join sentences with proper spacing
    const processedText = sentences.join(' ');
    
    console.log(`Processed ${sentences.length} sentences`);
    console.log(`Final text length: ${processedText.length} characters`);
    
    return processedText;
  } catch (error: any) {
    console.error('Error in text extraction:', error);
    throw new Error(`Text extraction failed: ${error.message || 'Unknown error'}`);
  }
}

// Common response headers
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache'
};

export async function POST(request: Request) {
  try {
    console.log('Starting PDF processing request...');
    
    // Create authenticated Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error('Authentication error:', authError);
      return Response.json({
        success: false,
        error: 'Unauthorized',
        details: authError?.message || 'No active session'
      }, { 
        status: 401,
        headers: RESPONSE_HEADERS
      });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Request body parsing error:', error);
      return Response.json({
        success: false,
        error: 'Invalid request body',
        details: 'Failed to parse JSON request body'
      }, { 
        status: 400,
        headers: RESPONSE_HEADERS
      });
    }

    const { pdfUrl } = body;
    if (!pdfUrl) {
      return Response.json({
        success: false,
        error: 'PDF URL is required',
        details: 'The pdfUrl field is missing from the request body'
      }, { 
        status: 400,
        headers: RESPONSE_HEADERS
      });
    }

    console.log(`Processing PDF from URL: ${pdfUrl}`);
    
    // Create the table if it doesn't exist
    console.log('Checking/creating PDF table...');
    const { error: createTableError } = await supabase.rpc('create_pdf_table');
    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return Response.json({
        success: false,
        error: 'Failed to create table',
        details: createTableError.message
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    // Extract the path from the Supabase URL
    const urlParts = pdfUrl.split('/public/');
    if (urlParts.length !== 2) {
      return Response.json({
        success: false,
        error: 'Invalid PDF URL',
        details: 'URL must be a valid Supabase storage URL'
      }, { 
        status: 400,
        headers: RESPONSE_HEADERS
      });
    }

    const storagePath = urlParts[1];
    console.log('Storage path:', storagePath);

    // Download the file from Supabase storage
    console.log('Downloading PDF from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('pdf')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Error downloading PDF:', downloadError);
      return Response.json({
        success: false,
        error: 'Failed to download PDF',
        details: downloadError?.message || 'Unknown error'
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    console.log('PDF downloaded successfully');

    // Convert Blob to Buffer
    console.log('Converting PDF to buffer...');
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract and process text from PDF
    console.log('Extracting text from PDF...');
    let content;
    try {
      content = await extractTextFromPDF(buffer);
      console.log('Text extraction completed successfully');
    } catch (parseError: any) {
      console.error('PDF processing error:', parseError);
      return Response.json({
        success: false,
        error: 'PDF processing failed',
        details: parseError.message || 'Unknown error'
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    // Check if the document exists
    console.log('Checking if document exists...');
    const { data: existingDoc, error: checkError } = await supabase
      .from('pdf_documents')
      .select('id, title, url')
      .eq('url', pdfUrl)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Document lookup error:', checkError);
      return Response.json({
        success: false,
        error: 'Failed to check document existence',
        details: checkError.message
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    let documentId;
    if (!existingDoc) {
      // Document doesn't exist, create it
      console.log('Creating new document entry...');
      const filename = decodeURIComponent(storagePath);
      const pdfInfo = PDF_FILES[filename];
      
      if (!pdfInfo) {
        return Response.json({
          success: false,
          error: 'Invalid PDF URL',
          details: 'The provided URL does not match any known PDF document'
        }, { 
          status: 400,
          headers: RESPONSE_HEADERS
        });
      }

      const { data: insertData, error: insertError } = await supabase
        .from('pdf_documents')
        .insert({
          title: pdfInfo.title,
          url: pdfUrl,
          content: content,
          extraction_successful: true,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError || !insertData) {
        console.error('Error creating document:', insertError);
        return Response.json({
          success: false,
          error: 'Failed to create document',
          details: insertError?.message || 'Unknown error'
        }, { 
          status: 500,
          headers: RESPONSE_HEADERS
        });
      }

      documentId = insertData.id;
      console.log('New document created with ID:', documentId);
    } else {
      documentId = existingDoc.id;
      console.log('Updating existing document with ID:', documentId);
      
      // Update the existing document
      const { error: updateError } = await supabase
        .from('pdf_documents')
        .update({
          content: content,
          extraction_successful: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Content update error:', updateError);
        return Response.json({
          success: false,
          error: 'Failed to update document',
          details: updateError.message
        }, { 
          status: 500,
          headers: RESPONSE_HEADERS
        });
      }
    }

    // Update the content vector
    console.log('Updating content vectors...');
    const { error: updateVectorError } = await supabase.rpc('update_content_vectors');
    if (updateVectorError) {
      console.error('Vector update error:', updateVectorError);
      return Response.json({
        success: false,
        error: 'Failed to update content vectors',
        details: updateVectorError.message
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    // Get the final document state
    console.log('Fetching final document state...');
    const { data: finalDoc, error: finalError } = await supabase
      .from('pdf_documents')
      .select('id, title, content, processed_at')
      .eq('id', documentId)
      .single();

    if (finalError || !finalDoc) {
      console.error('Error fetching final document state:', finalError);
      return Response.json({
        success: false,
        error: 'Failed to fetch final document state',
        details: finalError?.message || 'Unknown error'
      }, { 
        status: 500,
        headers: RESPONSE_HEADERS
      });
    }

    console.log('Processing completed successfully');
    return Response.json({
      success: true,
      message: 'PDF processed successfully',
      document: {
        id: finalDoc.id,
        title: finalDoc.title,
        contentLength: finalDoc.content.length,
        sentences: finalDoc.content.split('. ').length,
        processedAt: finalDoc.processed_at
      }
    }, { 
      status: 200,
      headers: RESPONSE_HEADERS
    });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    }, { 
      status: 500,
      headers: RESPONSE_HEADERS
    });
  }
} 