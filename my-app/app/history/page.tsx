import { createClient } from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import Link              from 'next/link'
import { Card, CardContent } from "@/components/ui/card"
import { Button }        from "@/components/ui/button"
import { ChevronLeft, Calendar, Dumbbell, Activity, Moon, Zap, Clock, Flame, Bike, Home } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPOS — elimina todos los `any` del componente
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface HealthLog {
  log_date:      string
  sleep_hours:   number | null
  stress_level:  number | null
  fatigue_level: number | null
}

interface ExercisePerformed {
  name: string
  sets?: string
}

interface WorkoutSession {
  id:                  string
  created_at:          string
  session_date:        string        // ✅ columna de fecha propia, sin depender de created_at
  session_type:        string | null
  duration_seconds:    number | null
  rpe:                 number | null
  exercises_performed: ExercisePerformed[] | null
}

interface DayEntry {
  date:     string
  health:   HealthLog
  workouts: WorkoutSession[]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS — funciones puras, testeables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function formatDuration(secs: number | null): string {
  if (!secs || secs < 60) return '< 1 min'
  const mins = Math.floor(secs / 60)
  return mins >= 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m`
    : `${mins} min`
}

function getRpeStyle(rpe: number | null): string {
  if (!rpe)    return 'text-stone-500 bg-stone-50 border-stone-100'
  if (rpe >= 8) return 'text-rose-600 bg-rose-50 border-rose-100'
  if (rpe >= 5) return 'text-amber-600 bg-amber-50 border-amber-100'
  return               'text-teal-600 bg-teal-50 border-teal-100'
}

// Icono dinámico según el tipo de sesión prescrita por la IA
function getSessionIcon(sessionType: string | null): {
  Icon:  typeof Dumbbell
  style: string
} {
  const type = sessionType?.toLowerCase() ?? ''
  if (type.includes('cardio') || type.includes('aeróbic'))
    return { Icon: Bike,     style: 'bg-cyan-100 text-cyan-600'   }
  if (type.includes('neural') || type.includes('potencia'))
    return { Icon: Activity, style: 'bg-rose-100 text-rose-600'   }
  return   { Icon: Dumbbell, style: 'bg-violet-100 text-violet-600' }
}

// ✅ Comparación de fechas robusta usando session_date (DATE) en lugar de
//    created_at.startsWith(log_date) — created_at es TIMESTAMPTZ y puede
//    tener diferencias de timezone que rompan el match silenciosamente.
function matchesByDate(sessionDate: string, logDate: string): boolean {
  return sessionDate === logDate
}

function formatDateLabel(dateStr: string): string {
  // Parseo explícito para evitar el bug de timezone de `new Date('YYYY-MM-DD')`
  // que interpreta la fecha como UTC y puede mostrar el día anterior en UTC-3
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVER COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ✅ Fetch paralelo: evita waterfall secuencial
  const [{ data: healthLogs }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('log_date, sleep_hours, stress_level, fatigue_level')
      // ✅ Solo seleccionamos las columnas que usamos (no select('*'))
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(60), // Margen amplio para que el filtro posterior no quede vacío

    supabase
      .from('workout_sessions')
      .select('id, created_at, session_date, session_type, duration_seconds, rpe, exercises_performed')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(60),
  ])

  // ── Combinación y filtro: solo días con entrenamiento real ──
  const combinedHistory: DayEntry[] = (healthLogs ?? [])
    .map(log => ({
      date:     log.log_date,
      health:   log as HealthLog,
      workouts: (workouts ?? []).filter(w =>
        matchesByDate(w.session_date ?? w.created_at.slice(0, 10), log.log_date)
      ) as WorkoutSession[],
    }))
    .filter(day => day.workouts.length > 0)

  return (
    <div className="min-h-screen bg-stone-50 pb-24">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-stone-500 hover:bg-stone-100">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-black text-stone-800 tracking-tight">Historial de Carga</h1>
        </div>
        <Link href="/">
          <Button variant="secondary" size="icon" className="bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-full shadow-sm">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto mt-2">

        {/* ── Estado vacío ── */}
        {combinedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-3xl border border-stone-100 shadow-sm mt-8">
            <Calendar className="h-12 w-12 mb-4 text-stone-300" />
            <p className="font-medium text-stone-500">No hay entrenamientos completados.</p>
            <p className="text-xs mt-1">¡Haz tu check-in y comienza a moverte!</p>
          </div>
        ) : (

          combinedHistory.map((day) => (
            // ✅ key por fecha (única) en lugar de índice numérico
            <div key={day.date} className="space-y-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1 pl-2 border-l-2 border-teal-500 capitalize">
                {formatDateLabel(day.date)}
              </h3>

              <Card className="border border-stone-100 shadow-sm bg-white overflow-hidden rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-0">

                  {/* ── Biomarcadores del día ── */}
                  <div className="bg-stone-50/50 p-3 px-4 flex gap-5 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600" title="Horas de sueño">
                      <Moon     className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="font-bold">{day.health.sleep_hours ?? '--'}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600" title="Nivel de Estrés">
                      <Zap      className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-bold">{day.health.stress_level ?? '--'}/10</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600" title="Nivel de Fatiga">
                      <Activity className="h-3.5 w-3.5 text-rose-400" />
                      <span className="font-bold">{day.health.fatigue_level ?? '--'}/10</span>
                    </div>
                  </div>

                  {/* ── Sesiones del día ── */}
                  <div className="p-3 space-y-3">
                    {day.workouts.map((w) => {
                      const { Icon, style } = getSessionIcon(w.session_type)

                      return (
                        <div key={w.id} className="p-3 rounded-xl border border-stone-100 bg-stone-50/50 flex flex-col gap-2.5">
                          <div className="flex gap-3">
                            <div className={`mt-0.5 h-9 w-9 rounded-full flex items-center justify-center shadow-sm shrink-0 ${style}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-stone-800 leading-tight truncate">
                                {w.session_type ?? 'Sesión de Entrenamiento'}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold flex-wrap">
                                <span className="flex items-center gap-1 bg-white border border-stone-200 text-stone-500 px-2 py-0.5 rounded-md shadow-sm">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(w.duration_seconds)}
                                </span>
                                {w.rpe && w.rpe > 0 && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm ${getRpeStyle(w.rpe)}`}>
                                    <Flame className="h-3 w-3" /> RPE {w.rpe}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ── Ejercicios completados (máx 4 + contador) ── */}
                          {(w.exercises_performed?.length ?? 0) > 0 && (
                            <div className="pl-12 flex flex-wrap gap-1.5">
                              {w.exercises_performed!.slice(0, 4).map((ex, j) => (
                                <span key={j} className="text-[10px] font-medium text-stone-600 px-2.5 py-1 rounded-md bg-white border border-stone-200 shadow-sm">
                                  {ex.name}
                                </span>
                              ))}
                              {w.exercises_performed!.length > 4 && (
                                <span className="text-[10px] font-bold text-teal-600 px-2 py-1 rounded-md bg-teal-50 border border-teal-100">
                                  +{w.exercises_performed!.length - 4} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}