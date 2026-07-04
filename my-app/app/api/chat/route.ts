import { NextResponse } from "next/server";

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
}

interface GeminiModel {
  name: string
  supportedGenerationMethods: string[]
}

interface GeminiModelsResponse {
  models?: GeminiModel[]
}

interface ChatRequestBody {
  message: string
  history?: ChatMessage[]
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Falta API Key");

    const { message, history } = await request.json() as ChatRequestBody;

    const contextText = history 
      ? history.slice(-4).map((entry) => `${entry.role === 'user' ? 'Usuario' : 'BioBot'}: ${entry.text}`).join('\n')
      : "";

    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json() as GeminiModelsResponse;
    const availableModel = listData.models?.find((model) => 
        model.name.includes('gemini') && model.supportedGenerationMethods.includes('generateContent')
    );
    const modelName = availableModel ? availableModel.name.replace('models/', '') : 'gemini-1.5-flash';

    // Prompt enriquecido con MEMORIA
    const prompt = `
      Actúa como BioBot, asistente de salud de la app BioBalance.
      
      HISTORIAL DE CONVERSACIÓN RECIENTE:
      ${contextText}
      
      PREGUNTA ACTUAL DEL USUARIO:
      "${message}"
      
      INSTRUCCIONES:
      - Responde a la pregunta actual basándote en el historial si es necesario.
      - Sé breve, directo y motivador.
      - Si la pregunta no es de salud/deporte, responde amablemente que no puedes ayudar en eso.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json() as GeminiGenerateResponse;
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no entendí bien. ¿Podrías reformular?";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Error Chat:", error);
    return NextResponse.json({ reply: "Error de conexión con BioBot 🤖. Intenta más tarde." });
  }
}