import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PDFDocument {
  id: string;
  title: string;
  url: string;
  content: string;
  created_at: string;
}

export interface PDFSearchResult {
  answer: string;
  confidence: number;
  source: string;
}

// Helper function to preprocess PDF content for better searching
function preprocessPDFContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/[^\w\s.,?!:;()\[\]{}'"]/g, '') // Remove special characters
    .trim();
}

// Helper function to split content into chunks for better context retrieval
function splitIntoChunks(content: string, maxChunkSize: number = 500): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

export const fetchPDFContent = async (): Promise<PDFDocument[]> => {
  const { data, error } = await supabase
    .from('pdf_documents')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Preprocess the content for better searching
  return (data || []).map(doc => ({
    ...doc,
    content: preprocessPDFContent(doc.content)
  }));
};

export async function searchPDFContent(query: string): Promise<PDFSearchResult | null> {
  try {
    // Search for relevant content in the pdf_documents table
    const { data: documents, error } = await supabase
      .from('pdf_documents')
      .select('content, title')
      .textSearch('content', query)
      .limit(5);

    if (error) {
      console.error('Error searching PDF content:', error);
      return null;
    }

    if (!documents || documents.length === 0) {
      return null;
    }

    // Calculate relevance score based on content matching
    const results = documents.map(doc => {
      const contentLower = doc.content.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Simple relevance scoring based on word matches
      const queryWords = queryLower.split(' ');
      const matchCount = queryWords.filter(word => contentLower.includes(word)).length;
      const confidence = matchCount / queryWords.length;

      return {
        content: doc.content,
        title: doc.title,
        confidence
      };
    });

    // Sort by confidence and get the best match
    const bestMatch = results.sort((a, b) => b.confidence - a.confidence)[0];

    if (bestMatch.confidence < 0.3) {
      return null;
    }

    // Extract relevant portion of the content (simple approach)
    const sentences = bestMatch.content.split(/[.!?]+/);
    const relevantSentences = sentences.filter((sentence: string) => 
      query.toLowerCase().split(' ').some(word => 
        sentence.toLowerCase().includes(word)
      )
    ).slice(0, 3);

    return {
      answer: relevantSentences.join('. ') + '.',
      confidence: bestMatch.confidence,
      source: bestMatch.title
    };
  } catch (error) {
    console.error('Error in searchPDFContent:', error);
    return null;
  }
}

// Common English words to filter out from queries
const commonWords = [
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'from', 'they', 'will', 'would', 'there', 'their', 'what', 'about',
  'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'people',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'other', 'than',
  'then', 'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after',
  'work', 'first', 'well', 'even', 'want', 'because', 'these', 'give', 'most'
]; 