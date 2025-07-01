import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { extractTextFromPDF } from '@/app/services/pdfParser';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('PDF upload request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Check if it's a PDF
    if (!file.name.endsWith('.pdf')) {
      console.log('Uploaded file is not a PDF');
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Create Supabase client
    console.log('Creating Supabase client');
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    console.log('Checking authentication');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.log('User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated, proceeding with upload');

    // Create a service role client that bypasses RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Check if 'pdfs' bucket exists
      console.log('Checking if storage bucket exists');
      const { data: buckets, error: bucketsError } = await supabaseAdmin
        .storage
        .listBuckets();
        
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        // Continue anyway, attempt to use the bucket regardless
        console.log('Continuing despite bucket listing error');
      }
      
      const pdfsBucketExists = buckets?.some(bucket => bucket.name === 'pdfs') || false;
      
      if (!pdfsBucketExists) {
        console.log('Creating pdfs bucket');
        try {
          const { error: createBucketError } = await supabaseAdmin
            .storage
            .createBucket('pdfs', { public: true });
            
          if (createBucketError) {
            console.error('Error creating pdfs bucket:', createBucketError);
            return NextResponse.json(
              { error: `Failed to create storage bucket: ${createBucketError.message}` },
              { status: 500 }
            );
          }
          console.log('Successfully created pdfs bucket');
        } catch (bucketError) {
          console.error('Error creating bucket:', bucketError);
        }
      }
    
      // Convert file to arrayBuffer
      console.log('Converting file to buffer');
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Upload PDF to Supabase Storage using admin client
      console.log('Uploading file to Supabase Storage');
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('pdfs')
        .upload(fileName, fileBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload PDF: ${uploadError.message}` },
          { status: 500 }
        );
      }

      console.log('File uploaded successfully, getting public URL');

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('pdfs')
        .getPublicUrl(uploadData.path);
      
      // Extract text from the PDF
      console.log('Extracting text from PDF');
      let extractedText = '';
      let extractionSuccessful = false;
      
      try {
        extractedText = await extractTextFromPDF(arrayBuffer);
        const textLength = extractedText?.length || 0;
        
        console.log(`Successfully extracted ${textLength} characters from PDF`);
        
        // Verify we actually got content
        if (textLength > 50 && !extractedText.includes('[Unable to extract PDF content')) {
          extractionSuccessful = true;
        } else {
          console.warn('Extracted text is suspiciously short or contains error markers:', extractedText.substring(0, 100));
          if (!extractedText.includes('[Unable to extract PDF content') && !extractedText.includes('Error extracting')) {
            extractionSuccessful = true; // At least we got something
          } else {
            extractedText = `Limited content extracted from ${file.name}. The PDF might be image-based, password-protected, or corrupted.`;
          }
        }
      } catch (extractError) {
        console.error('Error extracting text from PDF:', extractError);
        
        // Provide a more specific error message based on the error
        if (extractError instanceof Error) {
          if (extractError.message.includes('password')) {
            extractedText = `Unable to extract text from ${file.name}: The PDF appears to be password-protected.`;
          } else if (extractError.message.includes('timed out')) {
            extractedText = `Unable to extract text from ${file.name}: The processing timed out. The PDF may be too large or complex.`;
          } else if (extractError.message.includes('worker')) {
            extractedText = `Unable to extract text from ${file.name} due to PDF.js worker configuration issue. Please try again after the server restarts.`;
          } else {
            extractedText = `Unable to extract text from ${file.name}: ${extractError.message}`;
          }
        } else {
          extractedText = `Failed to extract text from ${file.name}. The PDF may be image-based or corrupted.`;
        }
      }
      
      console.log('Storing PDF metadata in database');
      
      // Try to insert with extraction_successful field
      try {
        // Store PDF metadata and content in database using admin client
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('pdf_documents')
          .insert({
            title: file.name,
            url: urlData.publicUrl,
            content: extractedText,
            created_at: new Date().toISOString(),
            extraction_successful: extractionSuccessful
          })
          .select();

        if (insertError) {
          // If error might be due to missing column, try without it
          if (insertError.message.includes('column') && insertError.message.includes('extraction_successful')) {
            console.log('Error with extraction_successful column, trying without it');
            
            const { data: fallbackInsertData, error: fallbackInsertError } = await supabaseAdmin
              .from('pdf_documents')
              .insert({
                title: file.name,
                url: urlData.publicUrl,
                content: extractedText,
                created_at: new Date().toISOString()
              })
              .select();
              
            if (fallbackInsertError) {
              console.error('Error inserting into database (fallback):', fallbackInsertError);
              return NextResponse.json(
                { error: `Failed to save PDF metadata: ${fallbackInsertError.message}` },
                { status: 500 }
              );
            }
            
            console.log('PDF processing completed successfully (without extraction status)');
            return NextResponse.json({
              message: 'PDF uploaded and processed successfully',
              pdf: fallbackInsertData[0],
              extraction_status: extractionSuccessful ? 'success' : 'failed'
            });
          }
          
          console.error('Error inserting into database:', insertError);
          return NextResponse.json(
            { error: `Failed to save PDF metadata: ${insertError.message}` },
            { status: 500 }
          );
        }

        console.log('PDF processing completed successfully');
        
        return NextResponse.json({
          message: 'PDF uploaded and processed successfully',
          pdf: insertData[0],
          extraction_status: extractionSuccessful ? 'success' : 'failed'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}` },
          { status: 500 }
        );
      }
    } catch (innerError) {
      console.error('Error during file processing:', innerError);
      return NextResponse.json(
        { error: `File processing error: ${innerError instanceof Error ? innerError.message : String(innerError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in upload-pdf route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 