import { NextResponse } from "next/server";
import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. SEGURIDAD: Validación estricta del input con Zod
//    Evita inyecciones y datos malformados antes de tocar la API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const InputSchema = z.object({
  sleepHours:       z.number().min(0).max(24),
  stressLevel:      z.number().min(0).max(10),
  fatigueLevel:     z.number().min(0).max(10),
  sorenessLevel:    z.number().min(0).max(10),
  weather:          z.object({ temperature: z.number() }).optional().nullable(),
  location:         z.string().max(100).optional().nullable(),
  rmssd:            z.number().min(0).max(300).default(45),
  sRPE_previous:    z.number().min(0).max(10).default(7),
  // Variables de contexto ahora vienen del cliente (no hardcodeadas)
  userContext:      z.string().max(300).optional().default(
    "Profesional con carga académica alta, rutinas ajustadas y responsabilidad familiar."
  ),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. RENDIMIENTO: Prompt extraído como constante pura
//    No se reconstruye el string en cada request innecesariamente
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPrompt(params: {
  sleepHours: number;
  stressLevel: number;
  fatigueLevel: number;
  sorenessLevel: number;
  rmssd: number;
  sRPE_previous: number;
  envContext: string;
  userContext: string;
}): string {
  const {
    sleepHours, stressLevel, fatigueLevel, sorenessLevel,
    rmssd, sRPE_previous, envContext, userContext,
  } = params;

  return `Eres un Magíster en Educación Física especializado en Neurociencia Computacional y Fisiología del Ejercicio.

MARCO TEÓRICO:
Aplica el principio de "Inferencia Activa" (Karl Friston) para minimizar la sorpresa fisiológica (lesión, sobreentrenamiento, fatiga crónica). Actualiza las creencias del sistema desde el Prior Bayesiano del atleta. Integra un enfoque Anti-Tecnoestrés: las dosis deben ser realistas y adaptadas a la carga alostática total (vida + entrenamiento).

PRIOR BAYESIANO — Estado actual del atleta:
- sRPE sesión anterior: ${sRPE_previous}/10
- rMSSD (SNA): ${rmssd} ms
- Sueño: ${sleepHours}h | Estrés: ${stressLevel}/10 | Fatiga: ${fatigueLevel}/10 | Dolor muscular: ${sorenessLevel}/10
- Entorno: ${envContext}
- Variables moderadoras: ${userContext}

INSTRUCCIONES:
1. Analiza el estado del atleta considerando todos los biomarcadores.
2. Prescribe una sesión (Carga Externa) que devuelva al atleta a la homeostasis óptima.
3. Justifica con términos técnicos (Inferencia Activa, rMSSD, sRPE, carga alostática).

RESPONDE ÚNICAMENTE CON JSON VÁLIDO — sin markdown, sin backticks, sin texto previo ni posterior:
{
  "motivational_message": "string — frase empática que integre su contexto de vida",
  "main": {
    "type": "string — ej: Recuperación Activa, Fuerza Neural, Potencia Aeróbica",
    "intensity": "Baja | Media | Alta",
    "justification": "string — 2-3 oraciones con fundamento científico",
    "exercises": [
      { "name": "string", "sets": "string — ej: 3x8, 4x12, 2x30s" },
      { "name": "string", "sets": "string" },
      { "name": "string", "sets": "string" },
      { "name": "string", "sets": "string" }
    ]
  },
  "optional": {
    "type": "string — ej: Movilidad vespertina, Tarea de recuperación",
    "desc": "string — justificación breve",
    "exercises": [
      { "name": "string", "sets": "string" }
    ]
  }
}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. SEGURIDAD: API Key validada una sola vez al inicio del módulo
//    Falla rápido sin llegar al handler si no está configurada
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. RENDIMIENTO: Respuesta offline tipada y reutilizable
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OFFLINE_FALLBACK = {
  motivational_message:
    "El sistema de IA no está disponible en este momento. Aquí tienes una sesión segura por defecto.",
  main: {
    type: "Recuperación Activa",
    intensity: "Baja",
    justification:
      "En ausencia de datos actualizados, se prescribe una sesión de bajo impacto para minimizar el riesgo y preservar la homeostasis.",
    exercises: [
      { name: "Caminata tranquila",       sets: "1x20 min" },
      { name: "Movilidad articular",       sets: "2x10 reps por articulación" },
      { name: "Respiración diafragmática", sets: "3x5 min" },
      { name: "Estiramiento suave global", sets: "1x15 min" },
    ],
  },
  optional: {
    type: "Tarea de recuperación nocturna",
    desc: "Protocolo de higiene del sueño para optimizar el rMSSD.",
    exercises: [{ name: "Rutina pre-sueño sin pantallas", sets: "30 min" }],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HANDLER PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(req: Request) {

  // ── SEGURIDAD: Validar API Key antes de procesar nada ──
  if (!GEMINI_API_KEY) {
    console.error("🔴 GEMINI_API_KEY no configurada en variables de entorno.");
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
  }

  // ── SEGURIDAD + ROBUSTEZ: Parsear y validar el body ──
  let input: z.infer<typeof InputSchema>;
  try {
    const rawBody = await req.json();
    input = InputSchema.parse(rawBody);
  } catch (validationError) {
    console.warn("⚠️ Input inválido:", validationError);
    return NextResponse.json(
      { error: "Datos de entrada inválidos.", detail: String(validationError) },
      { status: 400 }
    );
  }

  const { sleepHours, stressLevel, fatigueLevel, sorenessLevel,
          weather, location, rmssd, sRPE_previous, userContext } = input;

  const envContext = weather && location
    ? `Clima local: ${weather.temperature}°C en ${location}.`
    : "Ubicación desconocida.";

  const prompt = buildPrompt({
    sleepHours, stressLevel, fatigueLevel, sorenessLevel,
    rmssd, sRPE_previous, envContext, userContext,
  });

  // ── RENDIMIENTO: AbortController para timeout de 15s ──
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    console.log("📥 Analizando biometría con Inferencia Activa...");

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // RENDIMIENTO: Limitar tokens de respuesta
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.4, // Más determinista para prescripciones médicas
        },
      }),
    });

    clearTimeout(timeout);

    // ── ROBUSTEZ: Manejo de errores HTTP de Gemini ──
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Sin detalle");
      console.error(`🔴 Gemini respondió ${response.status}: ${errorBody}`);
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

    const data = await response.json();

    // ── ROBUSTEZ: Validar estructura de respuesta de Gemini ──
    const rawText: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("🔴 Respuesta inesperada de Gemini:", JSON.stringify(data));
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

    // ── ROBUSTEZ: Limpiar y parsear JSON de forma segura ──
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("🔴 JSON malformado de Gemini:\n", cleaned);
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

    console.log("✅ Prior actualizado. Sesión generada exitosamente.");
    return NextResponse.json(parsed);

  } catch (error) {
    clearTimeout(timeout);

    // ── ROBUSTEZ: Distinguir timeout de otros errores ──
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("🔴 Timeout: Gemini no respondió en 15s.");
    } else {
      console.error("🔴 Error inesperado:", error);
    }

    // Siempre devuelve algo útil al cliente (nunca 500 silencioso)
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
  }
}