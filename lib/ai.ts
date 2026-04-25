import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIContent(prompt: string, modelName: string = 'gemini-2.0-flash') {
  // Try Gemini first
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (text) return text;
  } catch (error: any) {
    console.warn('Gemini failed, trying Groq fallback...', error.status || error.message);
    
    // Check if Groq key exists
    if (!process.env.GROQ_API_KEY) {
      throw error; // Re-throw if no fallback available
    }
  }

  // Fallback to Groq
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || response.statusText}`);
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI generation failed on both Gemini and Groq:', error);
    throw error;
  }
}
