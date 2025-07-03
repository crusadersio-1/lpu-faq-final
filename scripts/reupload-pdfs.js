const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reuploadPDFs() {
  try {
    console.log('Starting PDF re-upload process...');

    // Get all PDF documents from database
    const { data: pdfs, error: fetchError } = await supabase
      .from('pdf_documents')
      .select('*');

    if (fetchError) throw fetchError;

    // Process each PDF
    for (const pdf of pdfs) {
      const localPath = path.join('pdfs', pdf.title);
      
      // Check if file exists locally
      if (!fs.existsSync(localPath)) {
        console.error(`File not found locally: ${localPath}`);
        continue;
      }

      console.log(`Processing ${pdf.title}...`);

      // Read file
      const fileBuffer = fs.readFileSync(localPath);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pdf')
        .upload(pdf.title, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading ${pdf.title}:`, uploadError);
      } else {
        console.log(`Successfully uploaded ${pdf.title}`);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('pdf')
          .getPublicUrl(pdf.title);

        // Update database record with new URL
        const { error: updateError } = await supabase
          .from('pdf_documents')
          .update({ url: publicUrl })
          .eq('id', pdf.id);

        if (updateError) {
          console.error(`Error updating URL for ${pdf.title}:`, updateError);
        } else {
          console.log(`Updated database record for ${pdf.title}`);
        }
      }
    }

    console.log('\nRe-upload process completed!');

  } catch (error) {
    console.error('Error during re-upload process:', error);
  }
}

// Run the re-upload process
reuploadPDFs(); 