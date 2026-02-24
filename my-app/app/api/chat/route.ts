import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Falta API Key");

    // Recibimos el mensaje actual Y el historial
    const { message, history } = await request.json();

    // Convertimos el historial en texto para que Gemini entienda el contexto
    // Tomamos solo los últimos 4 mensajes para no saturar
    const contextText = history 
      ? history.slice(-4).map((m: any) => `${m.role === 'user' ? 'Usuario' : 'BioBot'}: ${m.text}`).join('\n')
      : "";

    // Configuración del modelo
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    const listData = await listResponse.json();
    const availableModel = listData.models?.find((m: any) => 
        m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')
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

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no entendí bien. ¿Podrías reformular?";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Error Chat:", error);
    return NextResponse.json({ reply: "Error de conexión con BioBot 🤖. Intenta más tarde." });
  }
}