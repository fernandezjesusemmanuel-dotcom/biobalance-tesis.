import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, Dumbbell, Activity, Moon, Zap, Clock, Flame, Bike, Home } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Obtener Logs de Salud
  const { data: healthLogs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(14)

  // 2. Obtener Sesiones de Entrenamiento
  const { data: workouts } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // 3. Combinar datos
  const combinedHistory = healthLogs?.map(log => {
      const dayWorkouts = workouts?.filter(w => w.created_at.startsWith(log.log_date)) || []
      return {
          date: log.log_date,
          health: log,
          workouts: dayWorkouts
      }
  }) || []

  const formatDuration = (secs: number) => {
      const mins = Math.floor(secs / 60)
      if (mins < 1) return "< 1 min"
      return `${mins} min`
  }

  const getRpeColor = (rpe: number) => {
      if (rpe >= 8) return "text-rose-600 bg-rose-50 border-rose-100"
      if (rpe >= 5) return "text-amber-600 bg-amber-50 border-amber-100"
      return "text-teal-600 bg-teal-50 border-teal-100"
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      
      {/* HEADER MEJORADO: Flecha Izquierda + Casa Derecha */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 p-4 flex items-center justify-between">
        
        {/* Lado Izquierdo: Volver + Título */}
        <div className="flex items-center gap-2">
            <Link href="/">
                <Button variant="ghost" size="icon" className="text-stone-500 hover:bg-stone-100">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            </Link>
            <h1 className="text-lg font-bold text-stone-800">Historial de Carga</h1>
        </div>

        {/* Lado Derecho: Ir al Inicio (NUEVO) */}
        <Link href="/">
            <Button variant="secondary" size="icon" className="bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-full shadow-sm">
                <Home className="h-5 w-5" />
            </Button>
        </Link>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        
        {combinedHistory.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay registros aún.</p>
            </div>
        ) : (
            combinedHistory.map((day, index) => (
                <div key={index} className="space-y-2">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1 pl-2 border-l-2 border-teal-500">
                        {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>

                    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            
                            {/* Biomarcadores */}
                            <div className="bg-stone-50/80 p-3 px-5 flex justify-between items-center border-b border-stone-100 text-xs">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5 text-stone-600">
                                        <Moon className="h-3.5 w-3.5 text-blue-500" /> 
                                        <span className="font-semibold">{day.health.sleep_hours}h</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-stone-600">
                                        <Zap className="h-3.5 w-3.5 text-amber-500" /> 
                                        <span className="font-semibold">{day.health.stress_level}/10</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-stone-600">
                                        <Activity className="h-3.5 w-3.5 text-rose-500" /> 
                                        <span className="font-semibold">{day.health.fatigue_level}/10</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sesiones */}
                            <div className="p-2">
                                {day.workouts.length > 0 ? (
                                    day.workouts.map((w: any, i: number) => {
                                        const isCardio = w.session_type.toLowerCase().includes('cardio')
                                        const iconBg = isCardio ? 'bg-cyan-100 text-cyan-700' : 'bg-violet-100 text-violet-700'
                                        const Icon = isCardio ? Bike : Dumbbell

                                        return (
                                            <div key={i} className="mb-2 last:mb-0 p-3 rounded-xl border border-stone-100 hover:border-teal-200 transition-colors bg-white flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${iconBg}`}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-stone-800 leading-tight">{w.session_type}</p>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-500 font-medium">
                                                                <span className="flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded">
                                                                    <Clock className="h-3 w-3" /> {formatDuration(w.duration_seconds)}
                                                                </span>
                                                                {w.rpe > 0 && (
                                                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${getRpeColor(w.rpe)}`}>
                                                                        <Flame className="h-3 w-3" /> RPE {w.rpe}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {w.exercises_performed && w.exercises_performed.length > 0 && (
                                                    <div className="pl-11 flex flex-wrap gap-1">
                                                        {w.exercises_performed.slice(0, 3).map((ex: any, j: number) => (
                                                            <span key={j} className="text-[9px] text-stone-500 px-2 py-0.5 rounded-full bg-stone-50 border border-stone-100">
                                                                {ex.name}
                                                            </span>
                                                        ))}
                                                        {w.exercises_performed.length > 3 && (
                                                            <span className="text-[9px] text-stone-400 px-1">+{w.exercises_performed.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-stone-300 italic">Día de recuperación</p>
                                    </div>
                                )}
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