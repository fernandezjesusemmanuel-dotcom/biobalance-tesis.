import type { AcademicEventType } from './academic-load'

export function buildExamWeekFallback(
  examTitle: string,
  daysUntil: number,
  eventType: AcademicEventType
) {
  const eventLabel = eventType === 'exam' ? 'examen' : 'entrega'
  const urgency =
    daysUntil === 0
      ? `Hoy tienes ${eventLabel}: "${examTitle}".`
      : `Faltan ${daysUntil} día(s) para ${eventLabel}: "${examTitle}".`

  return {
    motivational_message: `${urgency} El sistema reduce la carga física para proteger tu eje HPA y favorecer la recuperación cognitiva.`,
    main: {
      type: 'Descompresión Alostática',
      intensity: 'Baja',
      justification:
        'Durante la semana evaluativa, la carga alostática académica eleva el cortisol basal. Se prescriben protocolos de down-regulation parasimpático (Yoga Nidra, respiración 4-7-8) para minimizar el riesgo de sobreentrenamiento y preservar el rendimiento académico.',
      exercises: [
        {
          name: 'Yoga Nidra guiado (20 min)',
          sets: '1x20 min',
          videoUrl: 'https://www.youtube.com/results?search_query=yoga+nidra+guiado+español',
        },
        {
          name: 'Respiración 4-7-8',
          sets: '4 ciclos',
          videoUrl: 'https://www.youtube.com/results?search_query=respiracion+4+7+8+guiada',
        },
        {
          name: 'Movilidad cervical y dorsal',
          sets: '2x8 reps',
          videoUrl: 'https://www.youtube.com/results?search_query=movilidad+cervical+dorsal',
        },
        {
          name: 'Caminata consciente suave',
          sets: '1x15 min',
          videoUrl: 'https://www.youtube.com/results?search_query=caminata+consciente+meditacion',
        },
      ],
    },
    optional: {
      type: 'Micro-pausa cognitiva',
      desc: 'Protocolo breve entre bloques de estudio para reducir carga simpática.',
      exercises: [
        {
          name: 'Coherencia cardíaca 5 min',
          sets: '1x5 min',
          videoUrl: 'https://www.youtube.com/results?search_query=coherencia+cardiaca+5+minutos',
        },
      ],
    },
  }
}
