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
  plannedIntensity?: 'Baja' | 'Media' | 'Alta' // Intensidad que prescribió la IA
  onClose: () => void
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MÓDULO DE CARGA INTERNA (Foster et al., 1998)
// sRPE = RPE × Duración (min) → métrica de carga interna real
// Clasificación basada en rangos validados en la literatura
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getSRPEClassification(sRPE: number): { label: string; color: string; bg: string } {
  if (sRPE < 150)  return { label: 'Carga Baja',    color: 'text-teal-700',   bg: 'bg-teal-50'  }
  if (sRPE < 300)  return { label: 'Carga Moderada', color: 'text-blue-700',   bg: 'bg-blue-50'  }
  if (sRPE < 450)  return { label: 'Carga Alta',     color: 'text-amber-700',  bg: 'bg-amber-50' }
  return             { label: 'Carga Muy Alta',  color: 'text-rose-700',   bg: 'bg-rose-50'  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Escala de Foster (RPE 1-10 → descripción cualitativa)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getRPEDescription(val: number): string {
  if (val <= 2) return "Muy suave — Recuperación activa"
  if (val <= 4) return "Suave — Aeróbico ligero"
  if (val <= 6) return "Moderado — Sostenible"
  if (val <= 8) return "Duro — Fatigante"
  return              "Máximo — Agotador"
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Diferencia entre intensidad planeada por la IA y lo real
// Esto alimenta el "error de predicción" del modelo Friston
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getPredictionError(planned: Props['plannedIntensity'], actualRPE: number): string | null {
  if (!planned) return null
  const highRPE   = actualRPE >= 7
  const lowRPE    = actualRPE <= 4

  if (planned === 'Alta'  && lowRPE)  return "La IA sobreestimó tu capacidad hoy. El Prior se actualizará."
  if (planned === 'Baja'  && highRPE) return "La IA subestimó tu capacidad hoy. El Prior se actualizará."
  if (planned === 'Media' && highRPE) return "Sesión más exigente de lo esperado. El Prior se actualizará."
  return null
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function WorkoutFeedback({ userId, logId, plannedIntensity, onClose }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [rpe,      setRpe]      = useState([5])
  const [duration, setDuration] = useState([45])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Carga Interna calculada en tiempo real (sRPE = RPE × Duración)
  const sRPE           = rpe[0] * duration[0]
  const classification = getSRPEClassification(sRPE)
  const predictionError = getPredictionError(plannedIntensity, rpe[0])

  // Limpia el error si el usuario ajusta los sliders
  useEffect(() => { setError(null) }, [rpe, duration])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('daily_logs')
        .update({
          actual_rpe:          rpe[0],
          actual_duration_min: duration[0],
          actual_srpe:         sRPE,       // Carga interna real para el próximo Prior
          completed:           true,
        })
        .eq('id', logId)

      if (dbError) throw new Error(dbError.message)

      router.push('/dashboard')
      router.refresh()

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido"
      console.error("❌ WorkoutFeedback error:", message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }} // Cierra al clickar el fondo
    >
      <Card className="w-full max-w-md border-none shadow-2xl bg-white animate-in zoom-in-95 duration-200">
        <CardContent className="p-6 space-y-6">

          {/* ── Header ── */}
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">¡Sesión Completada!</h2>
            <p className="text-sm text-stone-500 mt-1">
              Calibremos tu IA para mañana. ¿Cómo estuvo?
            </p>
          </div>

          {/* ── Slider RPE ── */}
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mb-1">
                  <Flame className="h-3 w-3" /> Esfuerzo Percibido (RPE)
                </span>
                <span className="text-xs text-rose-600 font-medium">
                  {getRPEDescription(rpe[0])}
                </span>
              </div>
              <span className="text-lg font-black text-rose-700">{rpe[0]}/10</span>
            </div>
            <Slider value={rpe} onValueChange={setRpe} max={10} min={1} step={1} className="py-2" />
          </div>

          {/* ── Slider Duración ── */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Duración Real
              </span>
              <span className="text-lg font-black text-blue-700">{duration[0]} min</span>
            </div>
            <Slider value={duration} onValueChange={setDuration} max={120} min={5} step={5} className="py-2" />
          </div>

          {/* ── sRPE en tiempo real ── */}
          <div className={`${classification.bg} p-3 rounded-xl flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${classification.color}`} />
              <div>
                <p className={`text-xs font-bold ${classification.color}`}>
                  Carga Interna Real (sRPE)
                </p>
                <p className="text-[10px] text-stone-500">
                  {classification.label} · RPE {rpe[0]} × {duration[0]} min
                </p>
              </div>
            </div>
            <span className={`text-xl font-black ${classification.color}`}>{sRPE}</span>
          </div>

          {/* ── Error de Predicción IA (cuando la realidad difiere del plan) ── */}
          {predictionError && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <Brain className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{predictionError}</span>
            </div>
          )}

          {/* ── Error inline ── */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── CTA ── */}
          <Button
            className="w-full bg-stone-900 text-white font-bold h-12 rounded-xl"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando Prior...</>
              : 'Guardar y Cerrar Bucle'
            }
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}