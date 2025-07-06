import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// API endpoint for Gemini
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// PDF file mappings with their storage URLs
const PDF_FILES = {
  'FAQ LPU.pdf': {
    title: 'General FAQ Document',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//FAQ%20LPU.pdf'
  },
  'FRESHMEN-TUITION-FEE-2425-05-16-24.pdf': {
    title: 'Freshmen Tuition Fee Information 2024-2025',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//FRESHMEN-TUITION-FEE-2425-05-16-24.pdf'
  },
  'GSC-STUDENT-HANDBOOK-2024.pdf': {
    title: 'Student Handbook 2024',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//GSC-STUDENT-HANDBOOK-2024.pdf'
  },
  'LPU-College-Flyer-2025.pdf': {
    title: 'College Programs Flyer 2025',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//LPU-College-Flyer-2025.pdf'
  },
  'Student-Discipline-Guidebook-2023.pdf': {
    title: 'Student Discipline Guidelines 2023',
    url: 'https://pfmoazqzyfjakxljnqln.supabase.co/storage/v1/object/public/pdf//Student-Discipline-Guidebook-2023.pdf'
  }
};

// Function to extract text from PDF
async function extractPDFText(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl);
    const pdfBuffer = await response.arrayBuffer();
    // Here you would use a PDF parsing library like pdf-parse
    // For now, we'll return the content from the database
    return '';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

// Function to analyze PDF content with Gemini
async function analyzePDFContent(content: string, question: string, sources: string): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API key is not configured');
  }

  const prompt = `You are an AI assistant specifically for Lyceum of the Philippines University Manila campus (LPU Manila). 
Please answer the following question based on the provided document content. 
Always refer to the institution as "Lyceum of the Philippines University Manila" or "LPU Manila" (not other LPU branches).
If the information comes from the Student Handbook, start your response with "According to the LPU Manila Student Handbook".
For all other documents, provide the answer directly without mentioning the source, but always ensure you're referring to LPU Manila.

Use markdown formatting in your response:
- Use **bold** for important terms or key points
- Use *italics* for emphasis
- Use bullet points (-) for lists
- Use numbered lists (1., 2., etc.) for steps or sequences
- Use \`code\` for specific values or codes
- Use > for important notes or warnings

Question: ${question}

Document Content (from: ${sources}):
${content}

Please provide a clear and concise answer based on the document content. Always specify that you're referring to LPU Manila. 
If the information is not found in the document, say so, but try to infer or synthesize an answer if possible based on related content. 
Only suggest a website or page if the answer cannot be fully provided, or if the user needs more details.`;

  const apiResponse = await fetch(`${GEMINI_API_ENDPOINT}?key=${process.env.GOOGLE_AI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!apiResponse.ok) {
    throw new Error('Failed to analyze PDF content');
  }

  const data = await apiResponse.json();
  let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not find a clear answer in the LPU documents.';

  // Only keep "According to the LPU Student Handbook" if it's from the handbook
  if (!sources.includes('Student Handbook 2024')) {
    answer = answer.replace(/^(According to|Based on|From) the (document|Student Handbook)[.,:]\s*/i, '');
  }

  return answer;
}

function getRelevantSiteLink(topic: string) {
  const map: Record<string, string> = {
    tuition: 'https://lpumanila.edu.ph/admissions/tuition-fees/',
    payment: 'https://lpumanila.edu.ph/admissions/payment-options/',
    scholarship: 'https://lpumanila.edu.ph/admissions/scholarships/',
    handbook: 'https://lpumanila.edu.ph/student-handbook/',
    discipline: 'https://lpumanila.edu.ph/student-discipline/',
    programs: 'https://lpumanila.edu.ph/academics/',
  };
  for (const key in map) {
    if (topic.includes(key)) return map[key];
  }
  return 'https://lpumanila.edu.ph/';
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (/submit.*ticket|open.*ticket|file.*ticket|create.*ticket|support.*ticket|raise.*ticket/i.test(message)) {
      return NextResponse.json({
        response: `You can submit a support ticket here: [LPU Ticket Page](/ticket)`,
        source: 'Ticket Redirect'
      });
    }

    const searchQuery = message.toLowerCase().split(' ').join(' & ');
    const { data: faqMatches, error: faqError } = await supabase
      .from('faqs')
      .select('*')
      .textSearch('question', searchQuery, {
        type: 'plain',
        config: 'english'
      })
      .limit(1);

    if (faqError) {
      console.error('Error searching FAQs:', faqError);
    }

    if (faqMatches && faqMatches.length > 0) {
      return NextResponse.json({ response: faqMatches[0].answer, source: 'FAQ Database' });
    }

    const { data: pdfMatches, error: pdfError } = await supabase
      .from('pdf_documents')
      .select('title, content, url')
      .textSearch('content', searchQuery, {
        type: 'websearch',
        config: 'english'
      })
      .limit(3);

    if (pdfError) {
      console.error('Error searching PDFs:', pdfError);
      return NextResponse.json(
        { error: 'Failed to search PDF content' },
        { status: 500 }
      );
    }

    const topicKeywords = ['tuition', 'payment', 'scholarship', 'handbook', 'discipline', 'programs'];
    const lowerMsg = message.toLowerCase();
    const foundTopic = topicKeywords.find(kw => lowerMsg.includes(kw));
    const siteLink = foundTopic ? getRelevantSiteLink(foundTopic) : 'https://manila.lpu.edu.ph/';

    if (pdfMatches && pdfMatches.length > 0) {
      // Combine content from top matches for broader context
      const combinedContent = pdfMatches
        .map((doc) => `---\nSource: ${doc.title}\n${doc.content}`)
        .join('\n\n');
      const sources = pdfMatches.map(doc => doc.title).join(', ');

      let analysis = await analyzePDFContent(combinedContent, message, sources);

      // If Gemini says "not found" or similar, fallback to general Gemini answer
      if (/not found|does not mention|could not find|not available|no information/i.test(analysis)) {
        const fallbackPrompt = `You are a helpful assistant specifically for Lyceum of the Philippines University Manila campus (LPU Manila). 
Always refer to the institution as "Lyceum of the Philippines University Manila" or "LPU Manila" (not other LPU branches).
Answer the following question as specifically and completely as possible using the information you have.
Only suggest a website or page if the answer cannot be fully provided, or if the user needs more details.

Use markdown formatting in your response:
- Use **bold** for important terms or key points
- Use *italics* for emphasis
- Use bullet points (-) for lists
- Use numbered lists (1., 2., etc.) for steps or sequences
- Use \`code\` for specific values or codes
- Use > for important notes or warnings

Question: ${message}`;

        const fallbackResponse = await fetch(`${GEMINI_API_ENDPOINT}?key=${process.env.GOOGLE_AI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fallbackPrompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
          }),
        });
        const fallbackData = await fallbackResponse.json();
        let fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || analysis;
        // Add site link if not already present
        if (siteLink && !fallbackText.includes(siteLink)) {
          fallbackText += `\n\n> For more info, visit: [LPU Manila](${siteLink})`;
        }
        return NextResponse.json({ response: fallbackText, source: 'General LPU knowledge' });
      }

      // Add site/source link if relevant
      let siteLinkToShow = '';
      if (foundTopic && siteLink && !analysis.includes(siteLink)) {
        siteLinkToShow = `\n\n> For more info, visit: [LPU Manila](${siteLink})`;
      }
      // If PDF has a URL, add it as a source
      let pdfSourceLink = '';
      if (pdfMatches[0]?.url && !analysis.includes(pdfMatches[0].url)) {
        pdfSourceLink = `\n\n> Source: [${pdfMatches[0].title}](${pdfMatches[0].url})`;
      }

      // Limit answer length unless necessary
      if (analysis.length > 1200) {
        analysis = analysis.slice(0, 1100) + '...';
      }

      return NextResponse.json({
        response: analysis + siteLinkToShow + pdfSourceLink,
        source: sources
      });
    }

    // If no PDF matches, use Gemini for general response
    const prompt = `You are a helpful assistant specifically for Lyceum of the Philippines University Manila campus (LPU Manila). 
Always refer to the institution as "Lyceum of the Philippines University Manila" or "LPU Manila" (not other LPU branches).
Answer the following question as specifically and completely as possible using the information you have.
Only suggest a website or page if the answer cannot be fully provided, or if the user needs more details.

Use markdown formatting in your response:
- Use **bold** for important terms or key points
- Use *italics* for emphasis
- Use bullet points (-) for lists
- Use numbered lists (1., 2., etc.) for steps or sequences
- Use \`code\` for specific values or codes
- Use > for important notes or warnings

Question: ${message}`;

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Add site/source link if relevant
    if (siteLink && !generatedText?.includes(siteLink)) {
      generatedText += `\n\n> For more info, visit: [LPU Manila](${siteLink})`;
    }

    // Limit answer length unless necessary
    if (generatedText && generatedText.length > 1200) {
      generatedText = generatedText.slice(0, 1100) + '...';
    }

    if (!generatedText) {
      throw new Error('No response generated from AI');
    }

    return NextResponse.json({ response: generatedText, source: 'General LPU knowledge' });
  } catch (error: any) {
    console.error('Error processing chat:', error);
    let errorMessage = 'Failed to process message';
    let statusCode = 500;

    if (error.message.includes('not supported') || error.message.includes('model')) {
      errorMessage = 'The AI service is currently unavailable. Please try again later.';
    } else if (error.message.includes('quota') || error.message.includes('rate')) {
      errorMessage = 'The service is temporarily busy. Please try again in a few moments.';
      statusCode = 429;
    } else if (error.message.includes('key')) {
      errorMessage = 'There is a configuration issue. Please contact support.';
    } else if (error.message.includes('content')) {
      errorMessage = 'Your message could not be processed. Please try rephrasing your question.';
      statusCode = 400;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        type: error.constructor.name
      },
      { status: statusCode }
    );
  }
}