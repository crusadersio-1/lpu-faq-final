import * as pdfjs from 'pdfjs-dist';

// More reliable worker setup for Next.js
if (typeof window !== 'undefined') {
  try {
    // First try to get the version from pdfjs
    const pdfJsVersion = pdfjs.version || '3.11.174'; // Fallback to a known version
    
    // Use unpkg as primary CDN with cloudflare as backup
    pdfjs.GlobalWorkerOptions.workerSrc = 
      `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
      
    console.log(`PDF.js worker set to version ${pdfJsVersion}`);
  } catch (error) {
    console.error('Error setting up PDF.js worker:', error);
    
    // Last resort fallback to a fixed version from cdnjs
    pdfjs.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
    console.log('Using fallback PDF.js worker from cdnjs');
  }
}

/**
 * Extracts text from a PDF file
 * @param arrayBuffer The PDF file as an ArrayBuffer
 * @returns Promise<string> The extracted text
 */
export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      // We're on the server - not supported
      console.log('PDF extraction attempted on server - will use fallback extraction mechanism');
      return extractTextFallback(arrayBuffer);
    }
    
    // Ensure worker is set up
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      throw new Error('PDF.js worker source not set properly');
    }
    
    console.log('PDF extraction started with worker:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    // Load the PDF document with a timeout of 30 seconds
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableFontFace: true, // Improves compatibility in different environments
      cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
      cMapPacked: true,
    });
    
    // Set a timeout to prevent hanging
    const timeoutPromise = new Promise<pdfjs.PDFDocumentProxy>((_, reject) => {
      setTimeout(() => reject(new Error('PDF loading timed out after 30 seconds')), 30000);
    });
    
    // Race the loading task against the timeout
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    
    // Get the total number of pages
    const numPages = pdf.numPages;
    console.log(`PDF loaded with ${numPages} pages`);
    
    // Extract text from each page
    let fullText = '';
    
    for (let i = 1; i <= numPages; i++) {
      try {
        console.log(`Processing page ${i}/${numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Concatenate the text items, adding a space between each item
        const pageText = textContent.items
          .filter((item: any) => item.str && typeof item.str === 'string')
          .map((item: any) => item.str.trim())
          .join(' ')
          .replace(/\s+/g, ' '); // Normalize whitespace
        
        fullText += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        fullText += `[Error extracting page ${i}]\n\n`;
      }
    }
    
    // If no text was extracted, throw an error
    if (!fullText.trim()) {
      throw new Error('No text content could be extracted from the PDF');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF, trying fallback method:', error);
    
    // Try fallback method if main extraction fails
    try {
      return extractTextFallback(arrayBuffer);
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Fallback method for text extraction when the main method fails
 * This is a simpler implementation that might work when the full PDF.js fails
 */
async function extractTextFallback(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log('Attempting fallback PDF text extraction');
  try {
    if (typeof window === 'undefined') {
      return '[PDF content unavailable - server-side extraction not supported]';
    }
    
    // Use a simplified version of PDF.js directly from CDN if needed
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableFontFace: true,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let text = `[PDF with ${numPages} pages]\n\n`;
    
    // Only process first 5 pages in fallback mode to avoid timeouts
    const pagesToProcess = Math.min(numPages, 5);
    
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || '').join(' ');
      text += strings + '\n\n';
      
      if (i === pagesToProcess && numPages > pagesToProcess) {
        text += `[Remaining ${numPages - pagesToProcess} pages not processed in fallback mode]\n`;
      }
    }
    
    return text;
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return `[Unable to extract PDF content: ${error instanceof Error ? error.message : String(error)}]`;
  }
} 