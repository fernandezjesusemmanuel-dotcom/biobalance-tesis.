import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { text } = await request.json();

    // Instruimos a la IA para que actúe como un Psicólogo de Datos
    const prompt = `
      Analiza el siguiente relato hablado de un usuario sobre su día:
      "${text}"
      
      Basado en el tono, las palabras usadas y los síntomas mencionados, devuelve UNICAMENTE un objeto JSON con este formato (sin markdown, solo el JSON):
      {
        "stressLevel": (número del 1 al 10, donde 10 es pánico/burnout),
        "mood": (una palabra que resuma su emoción, ej: "Frustrado", "Motivado", "Agotado"),
        "advice": (un consejo de 1 frase corta y empática)
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Limpiamos el texto para obtener solo el JSON limpio
    const jsonString = rawText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonString);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error Análisis:", error);
    return NextResponse.json({ stressLevel: 5, mood: "Neutro", advice: "No pude analizar el audio, intenta manual." });
  }
}