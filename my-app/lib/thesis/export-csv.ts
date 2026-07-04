import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { daysUntilDate } from '@/lib/allostasis/academic-load'

export type ThesisExportRow = {
  user_id: string
  log_date: string
  gender: string | null
  employment_status: string | null
  caregiver_role: string | null
  sleep_quality: number | null
  event_name: string | null
  days_until_exam: number | null
  sleep_hours: number | null
  stress_level: number | null
  fatigue_level: number | null
  soreness_level: number | null
  rpe_score: number | null
  session_duration: number | null
  carga: number
}

type AcademicEventRow = {
  title: string
  event_date: string
}

type DailyLogRow = {
  log_date: string
  sleep_hours: number | null
  sleep_quality: number | null
  stress_level: number | null
  fatigue_level: number | null
  soreness_level: number | null
  rpe_score: number | null
  session_duration: number | null
}

type ProfileRow = {
  gender: string | null
  employment_status: string | null
  caregiver_status: string | null
}

function findNearestEventForLogDate(
  logDate: string,
  events: AcademicEventRow[]
): { event_name: string | null; days_until_exam: number | null } {
  const referenceDate = new Date(`${logDate}T00:00:00`)
  const upcoming = events
    .filter((event) => event.event_date >= logDate)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const nearest = upcoming[0]
  if (!nearest) {
    return { event_name: null, days_until_exam: null }
  }

  return {
    event_name: nearest.title,
    days_until_exam: daysUntilDate(nearest.event_date, referenceDate),
  }
}

export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildThesisCsv(rows: ThesisExportRow[]): string {
  const headers = [
    'user_id',
    'log_date',
    'gender',
    'employment_status',
    'caregiver_role',
    'sleep_quality',
    'event_name',
    'days_until_exam',
    'sleep_hours',
    'stress_level',
    'fatigue_level',
    'soreness_level',
    'rpe_score',
    'session_duration',
    'carga',
  ]

  const lines = rows.map((row) =>
    [
      row.user_id,
      row.log_date,
      row.gender,
      row.employment_status,
      row.caregiver_role,
      row.sleep_quality,
      row.event_name,
      row.days_until_exam,
      row.sleep_hours,
      row.stress_level,
      row.fatigue_level,
      row.soreness_level,
      row.rpe_score,
      row.session_duration,
      row.carga,
    ]
      .map(escapeCsvValue)
      .join(',')
  )

  return [headers.join(','), ...lines].join('\n')
}

export async function fetchThesisExportRows(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ThesisExportRow[]> {
  const [{ data: profile, error: profileError }, { data: logs, error: logsError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('gender, employment_status, caregiver_status')
        .eq('id', userId)
        .single(),
      supabase
        .from('daily_logs')
        .select(
          'log_date, sleep_hours, sleep_quality, stress_level, fatigue_level, soreness_level, rpe_score, session_duration'
        )
        .eq('user_id', userId)
        .order('log_date', { ascending: false }),
      supabase
        .from('academic_events')
        .select('title, event_date')
        .eq('user_id', userId)
        .order('event_date', { ascending: true }),
    ])

  if (profileError) throw new Error(profileError.message)
  if (logsError) throw new Error(logsError.message)
  if (eventsError) throw new Error(eventsError.message)
  if (!logs?.length) throw new Error('Sin datos para exportar.')

  const profileData = profile as ProfileRow | null
  const academicEvents = (events ?? []) as AcademicEventRow[]

  return (logs as DailyLogRow[]).map((log) => {
    const academic = findNearestEventForLogDate(log.log_date, academicEvents)

    return {
      user_id: userId,
      log_date: log.log_date,
      gender: profileData?.gender ?? null,
      employment_status: profileData?.employment_status ?? null,
      caregiver_role: profileData?.caregiver_status ?? null,
      sleep_quality: log.sleep_quality,
      event_name: academic.event_name,
      days_until_exam: academic.days_until_exam,
      sleep_hours: log.sleep_hours,
      stress_level: log.stress_level,
      fatigue_level: log.fatigue_level,
      soreness_level: log.soreness_level,
      rpe_score: log.rpe_score,
      session_duration: log.session_duration,
      carga: (log.rpe_score ?? 0) * (log.session_duration ?? 0),
    }
  })
}

export function downloadThesisCsv(rows: ThesisExportRow[], filename = 'BioBalance_Datos_Tesis.csv'): void {
  const csv = buildThesisCsv(rows)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
