'use client'

import { useState, useMemo } from 'react'
import { createClient }       from '@/lib/supabase/client'
import { useRouter }          from 'next/navigation'
import { Button }             from "@/components/ui/button"
import { Moon, Battery, Gauge, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Link                   from 'next/link'

// ── Simulación de biomarcadores (Foster, 1998 / Shaffer, 2017) ──
function simulateBiomarkers(stress: number, fatigue: number) {
  const rmssd        = Math.max(15, Math.min(85, 85 - stress * 5 - fatigue * 4))
  const sRPE_previous = fatigue >= 7 ? 9 : fatigue <= 3 ? 3 : 6
  return { rmssd, sRPE_previous }
}

export default function LogPage() {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [sleep,    setSleep]    = useState(7)
  const [stress,   setStress]   = useState(3)
  const [fatigue,  setFatigue]  = useState(3)
  const [soreness, setSoreness] = useState(1)
  const [rpe,      setRpe]      = useState(5)
  const [duration, setDuration] = useState(60)
  const [notes,    setNotes]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const sRPE = rpe * duration
  const isDurationZero = duration === 0

  const handleSave = async () => {
    if (isDurationZero) {
      setError('La duración no puede ser 0. Es necesaria para calcular la Carga Interna (sRPE).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('No autenticado.')

      const today = new Date().toISOString().split('T')[0]
      const { rmssd, sRPE_previous } = simulateBiomarkers(stress, fatigue)

      const { error: upsertError } = await supabase.from('daily_logs').upsert({
        user_id:          user.id,
        log_date:         today,
        sleep_hours:      sleep,
        stress_level:     stress,
        fatigue_level:    fatigue,
        soreness_level:   soreness,
        rpe_score:        rpe,
        session_duration: duration,
        notes,
        simulated_rmssd:         rmssd,
        simulated_srpe_previous: sRPE_previous,
      }, { onConflict: 'user_id, log_date' })

      if (upsertError) throw new Error(upsertError.message)

      router.push('/')
      router.refresh()

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-32">
      <div className="flex items-center gap-4 mb-6 pt-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Finalizar Registro</h1>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* ── Bloque de entrenamiento ── */}
        <div className="bg-stone-900 text-white p-6 rounded-[32px] shadow-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Gauge className="h-5 w-5 text-teal-400" />
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-stone-400">
              Datos de Entrenamiento
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-stone-500 uppercase">Esfuerzo (RPE)</label>
              <span className="text-4xl font-black text-teal-400 leading-none">{rpe}</span>
            </div>
            <input
              type="range" min="1" max="10" step="1" value={rpe}
              onChange={e => setRpe(parseInt(e.target.value))}
              className="w-full h-3 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-stone-500 uppercase">Duración</label>
              <span className={`text-2xl font-bold ${isDurationZero ? 'text-rose-400' : 'text-white'}`}>
                {duration === 0 ? 'Sin duración' : `${duration} min`}
              </span>
            </div>
            <input
              type="range" min="0" max="180" step="5" value={duration}
              onChange={e => { setDuration(parseInt(e.target.value)); setError(null) }}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="flex justify-between items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Carga Interna (sRPE)
            </p>
            <p className="text-lg font-black text-teal-400">
              {duration > 0 ? sRPE : '--'}
            </p>
          </div>
        </div>

        {/* ── Bienestar ── */}
        <div className="grid gap-4 grid-cols-2">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-2 flex items-center gap-1">
              <Moon className="h-3 w-3" /> Horas Sueño
            </p>
            <input
              type="range" min="0" max="12" step="0.5" value={sleep}
              onChange={e => setSleep(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <p className="text-center font-black text-indigo-900 mt-2">{sleep}h</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-2 flex items-center gap-1">
              <Battery className="h-3 w-3" /> Fatiga
            </p>
            <input
              type="range" min="1" max="10" step="1" value={fatigue}
              onChange={e => setFatigue(parseInt(e.target.value))}
              className="w-full accent-amber-600"
            />
            <p className="text-center font-black text-amber-900 mt-2">{fatigue}/10</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading || isDurationZero}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black h-16 rounded-2xl shadow-xl text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Procesando...</>
            : 'Guardar y Ver Diagnóstico'
          }
        </Button>
      </div>
    </div>
  )
}