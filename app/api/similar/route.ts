import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const { answer, userQuestion } = await req.json();

    if (!answer || !userQuestion) {
      return NextResponse.json({ followups: [] }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ followups: [] }, { status: 500 });
    }
    
    const prompt = `
You are a helpful assistant for Lyceum of the Philippines University Manila campus (LPU Manila).
Given the following user question and your answer, suggest 3 relevant and natural follow-up questions that a student might ask next.
Do NOT rephrase or repeat the original question. Only provide follow-up questions that would logically come after the answer.
Return only the questions as a JSON array of strings.

User Question: "${userQuestion}"
Assistant Answer: "${answer}"

Follow-up questions (as a JSON array of strings):
`;

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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!apiResponse.ok) {
      return NextResponse.json({ followups: [] }, { status: 500 });
    }

    const data = await apiResponse.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let followups: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) {
        followups = JSON.parse(match[0]);
      } else {
        followups = text
          .split('\n')
          .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    } catch {
      followups = [];
    }

    followups = Array.isArray(followups) ? followups.slice(0, 3) : [];

    return NextResponse.json({ followups });
  } catch (error) {
    return NextResponse.json({ followups: [] }, { status: 500 });
  }
}