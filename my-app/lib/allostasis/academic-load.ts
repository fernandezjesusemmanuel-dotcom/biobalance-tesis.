export type AcademicEventType = 'exam' | 'delivery'

export interface AcademicEvent {
  id: string
  user_id: string
  title: string
  event_type: AcademicEventType
  event_date: string
  notes: string | null
  created_at: string
}

export function daysUntilDate(targetDate: string, fromDate = new Date()): number {
  const target = new Date(`${targetDate}T00:00:00`)
  const from = new Date(fromDate)
  from.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function getNearestUpcomingEvent(
  events: Pick<AcademicEvent, 'title' | 'event_type' | 'event_date'>[],
  fromDate = new Date()
): { title: string; eventType: AcademicEventType; eventDate: string; daysUntil: number } | null {
  const upcoming = events
    .map((event) => ({
      ...event,
      daysUntil: daysUntilDate(event.event_date, fromDate),
    }))
    .filter((event) => event.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const nearest = upcoming[0]
  if (!nearest) return null

  return {
    title: nearest.title,
    eventType: nearest.event_type,
    eventDate: nearest.event_date,
    daysUntil: nearest.daysUntil,
  }
}

export function isExamWeek(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= 7
}

export function getAcademicLoadPhase(daysUntil: number | null): 'none' | 'approaching' | 'exam_week' | 'exam_day' {
  if (daysUntil === null || daysUntil < 0) return 'none'
  if (daysUntil === 0) return 'exam_day'
  if (daysUntil <= 7) return 'exam_week'
  if (daysUntil <= 14) return 'approaching'
  return 'none'
}

export function formatAcademicPhaseLabel(phase: ReturnType<typeof getAcademicLoadPhase>): string {
  switch (phase) {
    case 'exam_day':
      return 'Día de evaluación'
    case 'exam_week':
      return 'Semana de examen'
    case 'approaching':
      return 'Evaluación próxima'
    default:
      return 'Sin evaluaciones cercanas'
  }
}
