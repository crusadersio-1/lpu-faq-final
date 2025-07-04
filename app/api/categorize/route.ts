import { NextResponse } from 'next/server';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function categorizeWithGemini(messages: string[]): Promise<string[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('Google AI API key is not configured');

  const prompt = `You are an expert university helpdesk assistant. Categorize each user message below into ONE topic from this list: Admissions, Tuition, Technical Support, Grades, Enrollment, Scholarships, Documents, Portal, Events, Others.
Respond with only the category for each message, in order, comma-separated.

Example:
Messages:
1. How do I apply for a scholarship?
2. I can't log in to the student portal.
3. What are the tuition fees for next semester?

Categories:
Scholarships, Technical Support, Tuition

Messages:
${messages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Categories:`;

  const res = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 100,
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('Gemini API error:', errorData);
    throw new Error(errorData.error?.message || 'Gemini API error');
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Gemini raw response:', text);

  let categoriesLine = text
    .split('\n')
    .find(line => line.trim() && !line.toLowerCase().includes('message'));

  if (!categoriesLine) categoriesLine = text;

  return categoriesLine
    .replace(/^Categories:\s*/i, '')
    .split(',')
    .map((cat: string) => cat.trim() || 'Others');
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array.' }, { status: 400 });
    }
    if (messages.length > 3) {
      return NextResponse.json({ error: 'Batch size too large. Use 3 or fewer messages per request.' }, { status: 400 });
    }
    const categories = await categorizeWithGemini(messages);
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}