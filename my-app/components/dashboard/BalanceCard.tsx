'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent }  from "@/components/ui/card"
import { Button }             from "@/components/ui/button"
import { Slider }             from "@/components/ui/slider"
import { createClient }       from '@/lib/supabase/client'
import { useRouter }          from 'next/navigation'
import { Moon, Zap, Activity, HeartPulse, MapPin, Loader2, AlertCircle, Coffee, Briefcase, Mountain } from 'lucide-react'
import VoiceLogger            from './VoiceLogger'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Props { userId: string }

interface WeatherData { temperature: number; weathercode?: number }

type LocationStatus = 'searching' | 'found' | 'error'

// ✅ Union type en lugar de string — TypeScript puede validar los valores
type DayContext = 'Libre' | 'Normal' | 'Pesado'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MÓDULO DE SIMULACIÓN DE BIOMARCADORES (Tesis: MVP)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function simulateBiomarkers(stress: number, fatigue: number) {
  const rmssd         = Math.max(15, Math.min(85, 85 - stress * 5 - fatigue * 4))
  const sRPE_previous = fatigue >= 7 ? 9 : fatigue <= 3 ? 3 : 6
  return { rmssd, sRPE_previous }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTE: Configuración de botones de contexto
// Extraída del JSX para evitar repetición y facilitar cambios
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DAY_CONTEXTS: {
  value:       DayContext
  label:       string
  icon:        React.ReactNode
  activeClass: string
}[] = [
  { value: 'Libre',  label: 'Día Libre', icon: <Coffee    className="h-5 w-5 mb-1" />, activeClass: 'border-teal-500  bg-teal-50  text-teal-700'  },
  { value: 'Normal', label: 'Normal',    icon: <Briefcase className="h-5 w-5 mb-1" />, activeClass: 'border-blue-500  bg-blue-50  text-blue-700'  },
  { value: 'Pesado', label: 'Pesado',    icon: <Mountain  className="h-5 w-5 mb-1" />, activeClass: 'border-amber-500 bg-amber-50 text-amber-700' },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK: Geolocalización + Clima
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function useLocationAndWeather() {
  const [weatherData,     setWeatherData]     = useState<WeatherData | null>(null)
  const [locationName,    setLocationName]    = useState("Buscando satélites...")
  const [locationStatus,  setLocationStatus]  = useState<LocationStatus>('searching')

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationName("GPS no soportado")
      setLocationStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`),
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          ])
          const [weatherJson, geoJson] = await Promise.all([weatherRes.json(), geoRes.json()])

          setWeatherData(weatherJson.current_weather ?? null)
          const parts = [
            geoJson.address?.neighbourhood ?? geoJson.address?.suburb,
            geoJson.address?.city          ?? geoJson.address?.town
          ].filter(Boolean)
          setLocationName(parts.join(", ") || "Ubicación detectada")
          setLocationStatus('found')
        } catch {
          setLocationName("Ubicación no disponible")
          setLocationStatus('error')
        }
      },
      () => { setLocationName("GPS inactivo"); setLocationStatus('error') },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  return { weatherData, locationName, locationStatus }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: SliderField
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface SliderFieldProps {
  label:      string
  value:      number[]
  onChange:   (v: number[]) => void
  max:        number
  step:       number
  unit?:      string
  icon:       React.ReactNode
  colorClass: string
  textClass:  string
}

function SliderField({ label, value, onChange, max, step, unit = '/10', icon, colorClass, textClass }: SliderFieldProps) {
  return (
    <div className={`${colorClass} p-3 rounded-xl`}>
      <div className="flex justify-between mb-2">
        <span className={`text-xs font-bold ${textClass} flex items-center gap-1`}>{icon} {label}</span>
        <span className="text-xs font-bold">{value[0]}{unit}</span>
      </div>
      <Slider value={value} onValueChange={onChange} max={max} step={step} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function BalanceCard({ userId }: Props) {
  // ✅ useMemo: evita recrear el cliente Supabase en cada render
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const { weatherData, locationName, locationStatus } = useLocationAndWeather()

  const [step,       setStep]       = useState<1 | 2>(1)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [sleep,      setSleep]      = useState([7])
  const [stress,     setStress]     = useState([5])
  const [fatigue,    setFatigue]    = useState([5])
  const [soreness,   setSoreness]   = useState([2])
  const [dayContext, setDayContext]  = useState<DayContext>('Normal')

  useEffect(() => { setError(null) }, [sleep, stress, fatigue, soreness, dayContext])

  const handleVoiceProcessed = useCallback((data: any) => {
    if (!data) return
    if (data.sleep    !== undefined) setSleep([data.sleep])
    if (data.stress   !== undefined) setStress([data.stress])
    if (data.fatigue  !== undefined) setFatigue([data.fatigue])
    if (data.soreness !== undefined) setSoreness([data.soreness])
    setTimeout(() => setStep(2), 500)
  }, [])

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const today = new Date().toISOString().split('T')[0]

      const { error: upsertErr } = await supabase
        .from('daily_logs')
        .upsert(
          { user_id: userId, log_date: today, sleep_hours: sleep[0], stress_level: stress[0],
            fatigue_level: fatigue[0], soreness_level: soreness[0], day_context: dayContext },
          { onConflict: 'user_id, log_date' }
        )
      if (upsertErr) throw new Error("Error guardando biomarcadores: " + upsertErr.message)

      const { rmssd, sRPE_previous } = simulateBiomarkers(stress[0], fatigue[0])

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours: sleep[0], stressLevel: stress[0], fatigueLevel: fatigue[0],
          sorenessLevel: soreness[0], weather: weatherData, location: locationName,
          rmssd, sRPE_previous, dayContext,
          userContext: "Profesional con carga académica alta, rutinas ajustadas y responsabilidad familiar.",
        }),
      })
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)

      const recommendation = await res.json()

      const { error: routineErr } = await supabase
        .from('daily_logs')
        .update({ suggested_routine: recommendation })
        .eq('user_id', userId)
        .eq('log_date', today)
      if (routineErr) throw new Error("Error guardando rutina: " + routineErr.message)

      // ✅ push primero, refresh después — evita navegar a una página
      // que todavía está mostrando datos desactualizados del caché
      router.push('/workout')
      router.refresh()

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido")
      console.error("❌ BalanceCard error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-lg bg-white overflow-hidden">
      <CardContent className="p-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-stone-800">Check-in Diario</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 max-w-[90%] truncate">
                {locationStatus === 'searching'
                  ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  : <MapPin   className="h-3 w-3 shrink-0" />
                }
                <span className="truncate">{locationName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 1: Voz ── */}
        {step === 1 ? (
          <div className="space-y-4">
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-center">
              <p className="text-stone-500 text-sm mb-4 font-medium uppercase tracking-wide">
                Asistente de Prior Bayesiano
              </p>
              <h3 className="text-lg font-bold text-stone-800 mb-2">¿Cómo responde tu cuerpo hoy?</h3>
              <VoiceLogger onProcessed={handleVoiceProcessed} />
              <p className="text-xs text-stone-400 mt-4 italic">"Dime: Dormí 6 horas pero me siento fuerte..."</p>
            </div>
            <Button variant="ghost" className="w-full text-stone-400 text-xs" onClick={() => setStep(2)}>
              Entrada manual de biomarcadores
            </Button>
          </div>

        ) : (
          /* ── Step 2: Contexto + Sliders + Confirmar ── */
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">

            {/* ── Selector de Contexto del Día ── */}
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                Contexto de tu jornada
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DAY_CONTEXTS.map(({ value, label, icon, activeClass }) => (
                  <button
                    key={value}
                    onClick={() => setDayContext(value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      dayContext === value
                        ? activeClass
                        : 'border-transparent bg-stone-50 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    {icon}
                    <span className="text-[10px] font-bold uppercase">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Sliders Biométricos ── */}
            <div className="grid grid-cols-2 gap-4">
              <SliderField label="Sueño"  value={sleep}    onChange={setSleep}    max={12} step={0.5} unit="h" icon={<Moon      className="h-3 w-3" />} colorClass="bg-blue-50"   textClass="text-blue-700"  />
              <SliderField label="Estrés" value={stress}   onChange={setStress}   max={10} step={1}            icon={<Zap       className="h-3 w-3" />} colorClass="bg-amber-50"  textClass="text-amber-700" />
              <SliderField label="Fatiga" value={fatigue}  onChange={setFatigue}  max={10} step={1}            icon={<Activity  className="h-3 w-3" />} colorClass="bg-stone-100" textClass="text-stone-600" />
              <SliderField label="Dolor"  value={soreness} onChange={setSoreness} max={10} step={1}            icon={<HeartPulse className="h-3 w-3" />} colorClass="bg-rose-50"  textClass="text-rose-700"  />
            </div>

            {/* ── Error inline ── */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="w-full bg-stone-900 text-white font-bold h-12 rounded-xl"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculando Inferencia Activa...</>
                : 'Procesar Plan IA'
              }
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}