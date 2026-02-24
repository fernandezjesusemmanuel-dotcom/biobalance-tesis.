'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, ChevronLeft, Watch, Timer, Activity, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import WorkoutFeedback from '@/app/workout/WorkoutFeedback'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type TimerMode = 'stopwatch' | 'timer'
type Intensity = 'Baja' | 'Media' | 'Alta'

interface Exercise {
  name: string
  sets: string
}

interface WorkoutPlan {
  title: string
  type: string
  intensity: Intensity
  justification: string
  exercises: Exercise[]
  optional: { type: string; desc: string; exercises: Exercise[] } | null
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const FALLBACK_PLAN: WorkoutPlan = {
  title: "Entrenamiento Libre",
  type: "Mantenimiento",
  intensity: "Media",
  justification: "Sin log de hoy. Sesión libre de mantenimiento.",
  exercises: [{ name: "Movilidad general", sets: "10 min" }],
  optional: null,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK: Cronómetro / Temporizador
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function useTimer(mode: TimerMode) {
  const [seconds, setSeconds]   = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setSeconds(s => {
        if (mode === 'timer') {
          if (s <= 1) { setIsActive(false); return 0 }
          return s - 1
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive, mode])

  const toggle = useCallback(() => setIsActive(a => !a), [])
  const reset  = useCallback(() => {
    setIsActive(false)
    setSeconds(mode === 'timer' ? 60 : 0)
  }, [mode])

  return { seconds, isActive, toggle, reset }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: Tarjeta de ejercicio
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ExerciseCard({
  exercise, index, completed, onToggle,
}: { exercise: Exercise; index: number; completed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        completed
          ? 'bg-teal-900/40 border-teal-700/50 opacity-60'
          : 'bg-stone-900 border-stone-800 hover:border-stone-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          completed ? 'border-teal-500 bg-teal-500' : 'border-stone-600'
        }`}>
          {completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${completed ? 'line-through text-stone-500' : 'text-white'}`}>
            {index + 1}. {exercise.name}
          </p>
          <p className="text-xs text-teal-400 font-mono mt-0.5">{exercise.sets}</p>
        </div>
      </div>
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PÁGINA PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function WorkoutPage() {
  const supabase = createClient()

  const [timerMode, setTimerMode]           = useState<TimerMode>('stopwatch')
  const { seconds, isActive, toggle, reset } = useTimer(timerMode)

  const [loading,            setLoading]            = useState(true)
  const [fetchError,         setFetchError]         = useState<string | null>(null)
  const [plan,               setPlan]               = useState<WorkoutPlan | null>(null)
  const [logId,              setLogId]              = useState<string | null>(null)
  const [userId,             setUserId]             = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [showFeedback,       setShowFeedback]       = useState(false)

  // ── Obtener rutina del día ──
  useEffect(() => {
    async function fetchRoutine() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setFetchError("No autenticado."); setLoading(false); return }
        setUserId(user.id)

        const today = new Date().toISOString().split('T')[0]
        const { data: log, error: logError } = await supabase
          .from('daily_logs')
          .select('id, suggested_routine')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .maybeSingle()

        if (logError) throw new Error(logError.message)

        if (log?.suggested_routine) {
          const routine = log.suggested_routine
          const main    = routine.main ?? routine

          setLogId(log.id)
          setPlan({
            title:         main.type         ?? "Entrenamiento del Día",
            type:          `Intensidad: ${main.intensity ?? 'Media'}`,
            intensity:     (main.intensity   ?? 'Media') as Intensity,
            justification: main.justification ?? main.desc ?? "Plan adaptado a tu estado actual.",
            exercises:     main.exercises    ?? [],
            optional:      routine.optional  ?? null,
          })
        } else {
          setPlan(FALLBACK_PLAN)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error desconocido"
        console.error("❌ WorkoutPage fetchRoutine:", msg)
        setFetchError(msg)
        setPlan(FALLBACK_PLAN)
      } finally {
        setLoading(false)
      }
    }
    fetchRoutine()
  }, [supabase])

  const toggleExercise = useCallback((i: number) => {
    setCompletedExercises(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }, [])

  const switchTimerMode = useCallback((newMode: TimerMode) => {
    setTimerMode(newMode)
    reset()
  }, [reset])

  const progressPct = plan?.exercises.length
    ? Math.round((completedExercises.size / plan.exercises.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-stone-950 text-white pb-24 relative">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <span className="text-xs font-bold tracking-widest text-teal-500 uppercase flex items-center gap-2">
          <Activity className="h-4 w-4" /> Modo Ejecución
        </span>
        {/* Progreso visual en el header */}
        <span className="text-xs font-bold text-stone-400">
          {completedExercises.size}/{plan?.exercises.length ?? 0}
        </span>
      </div>

      {/* ── Cronómetro / Temporizador ── */}
      <div className="flex flex-col items-center py-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-teal-900/10 blur-3xl pointer-events-none" />

        <div className="flex gap-2 mb-6 bg-stone-900 p-1 rounded-full border border-stone-800 relative z-10">
          <button
            onClick={() => switchTimerMode('stopwatch')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${timerMode === 'stopwatch' ? 'bg-teal-600 text-white' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Watch className="h-3 w-3 inline mr-1" /> Cronómetro
          </button>
          <button
            onClick={() => switchTimerMode('timer')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${timerMode === 'timer' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <Timer className="h-3 w-3 inline mr-1" /> Temporizador
          </button>
        </div>

        <div className="text-8xl font-black tabular-nums tracking-tighter mb-6 drop-shadow-2xl relative z-10">
          {formatTime(seconds)}
        </div>

        <div className="flex gap-4 relative z-10">
          <Button
            onClick={reset}
            variant="outline"
            className="rounded-full h-14 w-14 border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-400"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggle}
            className={`rounded-full h-14 w-24 text-lg font-bold transition-all ${isActive ? 'bg-amber-500 text-black' : 'bg-teal-600 text-white'}`}
          >
            {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
        </div>
      </div>

      {/* ── Plan del día ── */}
      <div className="px-6 mt-2 space-y-4">

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-stone-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando inteligencia artificial...
          </div>
        )}

        {fetchError && !loading && (
          <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fetchError} — Mostrando plan de contingencia.</span>
          </div>
        )}

        {plan && !loading && (
          <>
            {/* Título e intensidad */}
            <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-black text-white leading-tight flex-1">{plan.title}</h2>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ml-2 shrink-0 ${
                  plan.intensity === 'Alta' ? 'bg-rose-900/60 text-rose-400' :
                  plan.intensity === 'Media' ? 'bg-amber-900/60 text-amber-400' :
                  'bg-teal-900/60 text-teal-400'
                }`}>
                  {plan.intensity}
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">{plan.justification}</p>
            </div>

            {/* Barra de progreso */}
            {plan.exercises.length > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-stone-500 mb-1.5 font-bold">
                  <span>PROGRESO</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ejercicios principales */}
            <div className="space-y-2">
              {plan.exercises.map((ex, i) => (
                <ExerciseCard
                  key={i}
                  exercise={ex}
                  index={i}
                  completed={completedExercises.has(i)}
                  onToggle={() => toggleExercise(i)}
                />
              ))}
            </div>

            {/* Opcional */}
            {plan.optional && (
              <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-800/50 border-dashed">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  2º Turno Opcional
                </p>
                <p className="text-xs font-bold text-stone-300 mb-1">{plan.optional.type}</p>
                <p className="text-[11px] text-stone-500 mb-3">{plan.optional.desc}</p>
                {plan.optional.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between text-xs text-stone-400">
                    <span>{ex.name}</span>
                    <span className="font-mono text-teal-500">{ex.sets}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Botón flotante: Terminar ── */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-stone-950/90 backdrop-blur-md border-t border-white/5">
          <Button
            onClick={() => setShowFeedback(true)}
            disabled={!logId}
            className="w-full h-14 bg-teal-600 hover:bg-teal-500 text-white font-black text-base rounded-2xl disabled:opacity-40"
          >
            Terminar y Cerrar Bucle IA
          </Button>
          {!logId && (
            <p className="text-center text-[10px] text-stone-600 mt-1">
              Sin log de hoy — el feedback no estará disponible
            </p>
          )}
        </div>
      )}

      {/* ── Modal: WorkoutFeedback (Inferencia Activa) ── */}
      {showFeedback && logId && userId && (
        <WorkoutFeedback
          userId={userId}
          logId={logId}
          plannedIntensity={plan?.intensity}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  )
}