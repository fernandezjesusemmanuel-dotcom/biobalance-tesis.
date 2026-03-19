import { NextResponse } from "next/server";
import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. SEGURIDAD: Validación estricta del input con Zod
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const InputSchema = z.object({
  sleepHours:    z.number().min(0).max(24),
  stressLevel:   z.number().min(0).max(10),
  fatigueLevel:  z.number().min(0).max(10),
  sorenessLevel: z.number().min(0).max(10),
  weather:       z.object({ temperature: z.number() }).optional().nullable(),
  location:      z.string().max(100).optional().nullable(),
  rmssd:         z.number().min(0).max(300).default(45),
  sRPE_previous: z.number().min(0).max(10).default(7),
  dayContext:    z.enum(['Libre', 'Normal', 'Pesado']).optional().default('Normal'),
  userContext:   z.string().max(300).optional().default(
    "Profesional con carga académica alta, rutinas ajustadas y responsabilidad familiar."
  ),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. TIPOS — extraídos del schema para reutilizar en buildPrompt
// ✅ FIX: dayContext tipado como literal, no string genérico.
//    TypeScript detectará usos incorrectos en compile time.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type DayContext = 'Libre' | 'Normal' | 'Pesado'

interface PromptParams {
  sleepHours:    number
  stressLevel:   number
  fatigueLevel:  number
  sorenessLevel: number
  rmssd:         number
  sRPE_previous: number
  envContext:    string
  userContext:   string
  dayContext:    DayContext  // ✅ tipo estricto en lugar de string
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. RENDIMIENTO: Prompt extraído como función pura
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPrompt(p: PromptParams): string {
  return `Eres un Magíster en Educación Física especializado en Neurociencia Computacional y Fisiología del Ejercicio.

MARCO TEÓRICO:
Aplica el principio de "Inferencia Activa" (Karl Friston) para minimizar la sorpresa fisiológica (lesión, sobreentrenamiento, fatiga crónica). Actualiza las creencias del sistema desde el Prior Bayesiano del atleta. Integra un enfoque Anti-Tecnoestrés: las dosis deben ser realistas y adaptadas a la carga alostática total (vida + entrenamiento).

PRIOR BAYESIANO — Estado actual del atleta:
- sRPE sesión anterior: ${p.sRPE_previous}/10
- rMSSD (SNA): ${p.rmssd} ms
- Sueño: ${p.sleepHours}h | Estrés: ${p.stressLevel}/10 | Fatiga: ${p.fatigueLevel}/10 | Dolor muscular: ${p.sorenessLevel}/10
- Contexto de la Jornada (Carga Alostática No Deportiva): Día ${p.dayContext}
- Entorno: ${p.envContext}
- Variables moderadoras: ${p.userContext}

INSTRUCCIONES CRÍTICAS SOBRE EL CONTEXTO DE LA JORNADA:
- Si es "Día Libre": El atleta NO tiene estrés laboral ni cognitivo hoy. Si su nivel de fatiga y dolor no es severo (menor a 7), APROVECHA esta ventana de baja carga alostática para prescribir un entrenamiento de ALTA INTENSIDAD o mayor volumen. ¡Es el día ideal para empujar los límites y generar adaptaciones!
- Si es "Día Pesado": El atleta enfrenta una alta demanda cognitiva o laboral. Prioriza dosis mínimas efectivas, neuro-recuperación, movilidad o intensidades bajas/medias para no sobrecargar el Sistema Nervioso Autónomo, incluso si durmió bien.
- Si es "Día Normal": Prescribe basándote puramente en el equilibrio de los biomarcadores actuales.

INSTRUCCIONES GENERALES:
1. Analiza el estado del atleta considerando todos los biomarcadores y su Contexto de la Jornada.
2. Prescribe una sesión (Carga Externa) que devuelva al atleta a la homeostasis óptima.
3. Justifica con términos técnicos (Inferencia Activa, rMSSD, sRPE, carga alostática, contexto laboral).

RESPONDE ÚNICAMENTE CON JSON VÁLIDO — sin markdown, sin backticks, sin texto previo ni posterior:
{
  "motivational_message": "string — frase empática que integre su contexto de vida y el tipo de día que tiene",
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
}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. SEGURIDAD: API Key validada una sola vez al inicio
// ✅ FIX: GEMINI_URL se construye DENTRO del handler, no aquí.
//    Si se construye en el módulo con key=undefined, esa URL
//    incorrecta queda en memoria aunque nunca se use.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. RENDIMIENTO: Fallback offline tipado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OFFLINE_FALLBACK = {
  motivational_message:
    "El sistema de IA no está disponible en este momento. Aquí tienes una sesión segura por defecto.",
  main: {
    type:          "Recuperación Activa",
    intensity:     "Baja",
    justification: "En ausencia de datos actualizados, se prescribe una sesión de bajo impacto para minimizar el riesgo y preservar la homeostasis.",
    exercises: [
      { name: "Caminata tranquila",        sets: "1x20 min"                  },
      { name: "Movilidad articular",       sets: "2x10 reps por articulación" },
      { name: "Respiración diafragmática", sets: "3x5 min"                   },
      { name: "Estiramiento suave global", sets: "1x15 min"                  },
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

  if (!GEMINI_API_KEY) {
    console.error("🔴 GEMINI_API_KEY no configurada.");
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
  }

  // ✅ FIX: URL construida aquí, solo cuando la key está confirmada
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // ── Validación del input ─────────────────────────────────
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
          weather, location, rmssd, sRPE_previous, userContext, dayContext } = input;

  const envContext = weather && location
    ? `Clima local: ${weather.temperature}°C en ${location}.`
    : "Ubicación desconocida.";

  const prompt = buildPrompt({
    sleepHours, stressLevel, fatigueLevel, sorenessLevel,
    rmssd, sRPE_previous, envContext, userContext, dayContext,
  });

  // ── Timeout ──────────────────────────────────────────────
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 15_000);

  try {
    console.log(`📥 Analizando biometría — Día ${dayContext}...`);

    const response = await fetch(GEMINI_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      signal:  controller.signal,
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
    });

    // ✅ FIX: clearTimeout en TODOS los paths de retorno,
    //    no solo en el catch. Sin esto el timer queda activo
    //    hasta los 15s aunque Gemini ya respondió.
    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Sin detalle");
      console.error(`🔴 Gemini respondió ${response.status}: ${errorBody}`);
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

    const data    = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;

    if (!rawText) {
      console.error("🔴 Respuesta inesperada de Gemini:", JSON.stringify(data));
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      console.log(`✅ Prior actualizado. Sesión ${dayContext} generada.`);
      return NextResponse.json(parsed);
    } catch {
      console.error("🔴 JSON malformado de Gemini:\n", cleaned);
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
    }

  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("🔴 Timeout: Gemini no respondió en 15s.");
    } else {
      console.error("🔴 Error inesperado:", error);
    }
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 });
  }
}