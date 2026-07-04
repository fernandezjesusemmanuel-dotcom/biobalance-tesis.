import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isExamWeek } from '@/lib/allostasis/academic-load'
import { buildExamWeekFallback } from '@/lib/allostasis/decompression-routine'

const InputSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10).default(7),
  stressLevel: z.number().min(0).max(10),
  fatigueLevel: z.number().min(0).max(10),
  sorenessLevel: z.number().min(0).max(10),
  fitnessLevel: z.number().min(1).max(10).default(5),
  weather: z.object({ temperature: z.number() }).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  rmssd: z.number().min(0).max(300).default(45),
  sRPE_previous: z.number().min(0).max(10).default(7),
  dayContext: z.enum(['Libre', 'Normal', 'Pesado']).optional().default('Normal'),
  userContext: z
    .string()
    .max(500)
    .optional()
    .default('Perfil sociodemográfico no completado.'),
  daysUntilExam: z.number().min(0).max(365).nullable().optional(),
  nearestExamTitle: z.string().max(200).nullable().optional(),
  nearestExamType: z.enum(['exam', 'delivery']).nullable().optional(),
  academicLoadPhase: z
    .enum(['none', 'approaching', 'exam_week', 'exam_day'])
    .optional()
    .default('none'),
})

type DayContext = 'Libre' | 'Normal' | 'Pesado'

interface PromptParams {
  sleepHours: number
  sleepQuality: number
  stressLevel: number
  fatigueLevel: number
  sorenessLevel: number
  fitnessLevel: number
  rmssd: number
  sRPE_previous: number
  envContext: string
  userContext: string
  dayContext: DayContext
  daysUntilExam: number | null
  nearestExamTitle: string | null
  nearestExamType: 'exam' | 'delivery' | null
  academicLoadPhase: string
}

function buildPrompt(p: PromptParams): string {
  const examContext =
    p.daysUntilExam != null && p.nearestExamTitle
      ? `Próxima evaluación: "${p.nearestExamTitle}" (${p.nearestExamType === 'delivery' ? 'entrega' : 'examen'}) en ${p.daysUntilExam} día(s). Fase académica: ${p.academicLoadPhase}.`
      : 'Sin evaluaciones académicas inmediatas registradas.'

  const examWeekRules =
    p.daysUntilExam != null && isExamWeek(p.daysUntilExam)
      ? `
REGLA CRÍTICA — SEMANA EVALUATIVA (T-${p.daysUntilExam}):
- PROHIBIDO prescribir entrenamiento de alta intensidad o volumen elevado.
- Priorizar descompresión alostática: Yoga Nidra, respiración 4-7-8, coherencia cardíaca, movilidad suave.
- Intensidad máxima permitida: Baja.
- Justificar la reducción de carga física por elevación del eje HPA y carga cognitiva académica.
`
      : ''

  return `Eres un Magíster en Educación Física especializado en Neurociencia Computacional y Fisiología del Ejercicio.

MARCO TEÓRICO:
Aplica el principio de "Inferencia Activa" (Karl Friston) para minimizar la sorpresa fisiológica (lesión, sobreentrenamiento, fatiga crónica). Actualiza las creencias del sistema desde el Prior Bayesiano del atleta. Integra un enfoque Anti-Tecnoestrés: las dosis deben ser realistas y adaptadas a la carga alostática total (vida académica + laboral + familiar + entrenamiento).

PRIOR BAYESIANO — Estado actual del atleta:
- sRPE sesión anterior: ${p.sRPE_previous}/10
- rMSSD (SNA): ${p.rmssd} ms
- Sueño: ${p.sleepHours}h | Calidad de sueño: ${p.sleepQuality}/10
- Estrés: ${p.stressLevel}/10 | Fatiga: ${p.fatigueLevel}/10 | Dolor muscular: ${p.sorenessLevel}/10
- Aptitud física autorreportada: ${p.fitnessLevel}/10
- Contexto de la Jornada (Carga Alostática No Deportiva): Día ${p.dayContext}
- Entorno: ${p.envContext}
- Perfil moderador (sociodemográfico + biológico): ${p.userContext}
- Contexto académico: ${examContext}
${examWeekRules}
INSTRUCCIONES CRÍTICAS SOBRE EL CONTEXTO DE LA JORNADA:
- Si es "Día Libre": Si fatiga y dolor < 7 Y NO hay semana evaluativa, puede prescribirse mayor intensidad según aptitud física.
- Si es "Día Pesado": Dosis mínimas efectivas, neuro-recuperación, intensidades bajas/medias.
- Si es "Día Normal": Equilibrio según biomarcadores y moderadores.

INSTRUCCIONES DE SEGURIDAD (APTITUD FÍSICA):
- Aptitud ≤ 4: evitar impacto alto, priorizar movilidad y respiración.
- Aptitud ≥ 8: puede tolerar mayor volumen SOLO si no hay semana evaluativa activa.

INSTRUCCIONES GENERALES:
1. Analiza el estado considerando biomarcadores, moderadores sociodemográficos y carga académica.
2. Prescribe sesión que devuelva al atleta a la homeostasis óptima.
3. Justifica con términos técnicos (Inferencia Activa, rMSSD, sRPE, carga alostática).
4. Para cada ejercicio incluye 'videoUrl' como link de búsqueda YouTube.

RESPONDE ÚNICAMENTE CON JSON VÁLIDO — sin markdown, sin backticks:
{
  "motivational_message": "string",
  "main": {
    "type": "string",
    "intensity": "Baja | Media | Alta",
    "justification": "string",
    "exercises": [
      { "name": "string", "sets": "string", "videoUrl": "string" },
      { "name": "string", "sets": "string", "videoUrl": "string" },
      { "name": "string", "sets": "string", "videoUrl": "string" },
      { "name": "string", "sets": "string", "videoUrl": "string" }
    ]
  },
  "optional": {
    "type": "string",
    "desc": "string",
    "exercises": [{ "name": "string", "sets": "string", "videoUrl": "string" }]
  }
}`
}

const OFFLINE_FALLBACK = {
  motivational_message:
    'El sistema de IA está descansando. Aquí tienes una sesión segura por defecto.',
  main: {
    type: 'Recuperación Activa',
    intensity: 'Baja',
    justification:
      'En ausencia de datos actualizados, se prescribe una sesión de bajo impacto para minimizar el riesgo y preservar la homeostasis.',
    exercises: [
      {
        name: 'Caminata tranquila',
        sets: '1x20 min',
        videoUrl: 'https://www.youtube.com/results?search_query=caminata+tecnica',
      },
      {
        name: 'Movilidad articular',
        sets: '2x10 reps',
        videoUrl: 'https://www.youtube.com/results?search_query=rutina+movilidad+articular',
      },
      {
        name: 'Respiración diafragmática',
        sets: '3x5 min',
        videoUrl: 'https://www.youtube.com/results?search_query=respiracion+diafragmatica+guiada',
      },
      {
        name: 'Estiramiento suave global',
        sets: '1x15 min',
        videoUrl: 'https://www.youtube.com/results?search_query=estiramientos+suaves+cuerpo+completo',
      },
    ],
  },
  optional: {
    type: 'Tarea de recuperación nocturna',
    desc: 'Protocolo de higiene del sueño para optimizar el rMSSD.',
    exercises: [
      {
        name: 'Rutina pre-sueño sin pantallas',
        sets: '30 min',
        videoUrl: 'https://www.youtube.com/results?search_query=rutina+yoga+para+dormir',
      },
    ],
  },
}

export async function POST(req: Request) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim()

  let input: z.infer<typeof InputSchema>
  try {
    const rawBody = await req.json()
    input = InputSchema.parse(rawBody)
  } catch (validationError) {
    console.warn('⚠️ Input inválido:', validationError)
    return NextResponse.json(
      { error: 'Datos de entrada inválidos.', detail: String(validationError) },
      { status: 400 }
    )
  }

  if (
    input.daysUntilExam != null &&
    isExamWeek(input.daysUntilExam) &&
    input.nearestExamTitle &&
    input.nearestExamType
  ) {
    return NextResponse.json(
      buildExamWeekFallback(
        input.nearestExamTitle,
        input.daysUntilExam,
        input.nearestExamType
      ),
      { status: 200 }
    )
  }

  if (!GEMINI_API_KEY) {
    console.error('🔴 GEMINI_API_KEY no configurada.')
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 })
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const {
    sleepHours,
    sleepQuality,
    stressLevel,
    fatigueLevel,
    sorenessLevel,
    fitnessLevel,
    weather,
    location,
    rmssd,
    sRPE_previous,
    userContext,
    dayContext,
    daysUntilExam,
    nearestExamTitle,
    nearestExamType,
    academicLoadPhase,
  } = input

  const envContext =
    weather && location
      ? `Clima local: ${weather.temperature}°C en ${location}.`
      : 'Ubicación desconocida.'

  const prompt = buildPrompt({
    sleepHours,
    sleepQuality,
    stressLevel,
    fatigueLevel,
    sorenessLevel,
    fitnessLevel,
    rmssd,
    sRPE_previous,
    envContext,
    userContext,
    dayContext,
    daysUntilExam: daysUntilExam ?? null,
    nearestExamTitle: nearestExamTitle ?? null,
    nearestExamType: nearestExamType ?? null,
    academicLoadPhase,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 })
    }

    const data = await response.json()
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined

    if (!rawText) {
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 })
    }

    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json(OFFLINE_FALLBACK, { status: 200 })
    }
  } catch {
    clearTimeout(timeout)
    return NextResponse.json(OFFLINE_FALLBACK, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      sistema: 'BioBalance Advisor IA',
      mensaje:
        'La API está funcionando correctamente. Para generar una rutina, envía una petición POST.',
    },
    { status: 200 }
  )
}
