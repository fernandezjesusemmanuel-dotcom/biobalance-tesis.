'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Flame, Clock, Loader2, AlertCircle, Brain, TrendingUp } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Props {
  userId: string
  logId: string
  plannedIntensity?: 'Baja' | 'Media' | 'Alta'
  onClose: () => void
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS CIENTÍFICOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getSRPEClassification(sRPE: number) {
  if (sRPE < 150)  return { label: 'Carga Baja',     color: 'text-teal-700',   bg: 'bg-teal-50'  }
  if (sRPE < 300)  return { label: 'Carga Moderada', color: 'text-blue-700',   bg: 'bg-blue-50'  }
  if (sRPE < 450)  return { label: 'Carga Alta',     color: 'text-amber-700',  bg: 'bg-amber-50' }
  return             { label: 'Carga Muy Alta',  color: 'text-rose-700',   bg: 'bg-rose-50'  }
}

function getRPEDescription(val: number): string {
  if (val <= 2) return "Muy suave — Recuperación activa"
  if (val <= 4) return "Suave — Aeróbico ligero"
  if (val <= 6) return "Moderado — Sostenible"
  if (val <= 8) return "Duro — Fatigante"
  return              "Máximo — Agotador"
}

function getPredictionError(planned: Props['plannedIntensity'], actualRPE: number): string | null {
  if (!planned) return null
  const highRPE   = actualRPE >= 7
  const lowRPE    = actualRPE <= 4
  if (planned === 'Alta'  && lowRPE)  return "La IA sobreestimó tu capacidad hoy. El Prior se actualizará."
  if (planned === 'Baja'  && highRPE) return "La IA subestimó tu capacidad hoy. El Prior se actualizará."
  if (planned === 'Media' && highRPE) return "Sesión más exigente de lo esperado. El Prior se actualizará."
  return null
}

export default function WorkoutFeedback({ userId, logId, plannedIntensity, onClose }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [rpe,      setRpe]      = useState([5])
  const [duration, setDuration] = useState([45])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const sRPE           = rpe[0] * duration[0]
  const classification = getSRPEClassification(sRPE)
  const predictionError = getPredictionError(plannedIntensity, rpe[0])

  useEffect(() => { setError(null) }, [rpe, duration])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ PASO 1: Obtenemos los datos de la sesión actual de la base de datos 
      // para saber qué ejercicios se sugirieron y guardarlos en el historial.
      const { data: currentLog } = await supabase
        .from('daily_logs')
        .select('suggested_routine')
        .eq('id', logId)
        .single();

      const routine = currentLog?.suggested_routine;
      const exercises = routine?.main?.exercises || routine?.exercises || [];
      const sessionType = routine?.main?.type || routine?.type || plannedIntensity || 'Entrenamiento';

      // ✅ PASO 2: Ejecutamos ambas actualizaciones en paralelo
      const [resLog, resWorkout] = await Promise.all([
        // Actualizamos el Log Diario (Bio-datos)
        supabase
          .from('daily_logs')
          .update({
            actual_rpe: rpe[0],
            actual_duration_min: duration[0],
            actual_srpe: sRPE,
            completed: true,
          })
          .eq('id', logId),

        // Creamos la Sesión de Entrenamiento (Historial visual)
        supabase
          .from('workout_sessions')
          .insert([{
            user_id: userId,
            log_id: logId,
            session_type: sessionType,
            duration_seconds: duration[0] * 60,
            rpe: rpe[0],
            exercises_performed: exercises,
            session_date: new Date().toISOString().split('T')[0] // ✅ Fecha robusta para el historial
          }])
      ]);

      if (resLog.error) throw resLog.error;
      if (resWorkout.error) throw resWorkout.error;

      router.push('/');
      router.refresh();

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error al guardar el entrenamiento"
      console.error("❌ WorkoutFeedback error:", message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card className="w-full max-w-md border-none shadow-2xl bg-white animate-in zoom-in-95 duration-200 rounded-3xl">
        <CardContent className="p-6 space-y-6">

          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-teal-600" />
            </div>
            <h2 className="text-2xl font-black text-stone-800 tracking-tight">¡Sesión Completada!</h2>
            <p className="text-sm text-stone-500 mt-1 font-medium">
              Calibremos tu IA para mañana. ¿Cómo estuvo?
            </p>
          </div>

          {/* Slider RPE */}
          <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-xs font-black text-rose-700 flex items-center gap-1 mb-1 uppercase tracking-wider">
                  <Flame className="h-3 w-3" /> Esfuerzo Percibido (RPE)
                </span>
                <span className="text-xs text-rose-600 font-bold">
                  {getRPEDescription(rpe[0])}
                </span>
              </div>
              <span className="text-2xl font-black text-rose-700">{rpe[0]}</span>
            </div>
            <Slider value={rpe} onValueChange={setRpe} max={10} min={1} step={1} className="py-2" />
          </div>

          {/* Slider Duración */}
          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                <Clock className="h-3 w-3" /> Duración Real
              </span>
              <span className="text-2xl font-black text-blue-700">{duration[0]} min</span>
            </div>
            <Slider value={duration} onValueChange={setDuration} max={120} min={5} step={5} className="py-2" />
          </div>

          {/* sRPE Real-time */}
          <div className={`${classification.bg} p-4 rounded-2xl flex items-center justify-between border border-white shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <TrendingUp className={`h-5 w-5 ${classification.color}`} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${classification.color}`}>
                  Carga Interna Real
                </p>
                <p className="text-sm font-bold text-stone-700">
                  {classification.label}
                </p>
              </div>
            </div>
            <span className={`text-2xl font-black ${classification.color}`}>{sRPE}</span>
          </div>

          {predictionError && (
            <div className="flex items-start gap-3 text-xs text-amber-800 bg-amber-50 border border-amber-200/50 rounded-2xl p-4 shadow-inner">
              <Brain className="h-5 w-5 shrink-0 text-amber-600" />
              <span className="font-medium leading-relaxed">{predictionError}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black h-14 rounded-2xl text-base shadow-lg transition-all active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Actualizando Prior...</>
              : 'Guardar y Cerrar Bucle'
            }
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}