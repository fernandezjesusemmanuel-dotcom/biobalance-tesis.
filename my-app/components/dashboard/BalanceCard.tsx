'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Moon,
  Zap,
  Activity,
  HeartPulse,
  MapPin,
  Loader2,
  AlertCircle,
  Coffee,
  Briefcase,
  Mountain,
  Brain,
  ArrowRight,
  Sparkles,
  Shield,
} from 'lucide-react'
import VoiceLogger from './VoiceLogger'
import { AnalysisPreviewCard } from '@/components/AnalysisPreviewCard'
import { buildUserContext } from '@/lib/allostasis/profile-context'
import {
  getNearestUpcomingEvent,
  isExamWeek,
  formatAcademicPhaseLabel,
  getAcademicLoadPhase,
} from '@/lib/allostasis/academic-load'

interface Props {
  userId: string
}

interface WeatherData {
  temperature: number
  weathercode?: number
}

type LocationStatus = 'searching' | 'found' | 'error'
type DayContext = 'Libre' | 'Normal' | 'Pesado'

type VoiceAnalysisData = {
  sleep?: number
  stress?: number
  fatigue?: number
  soreness?: number
}

type RoutinePreview = {
  type?: string
  intensity?: string
  justification?: string
  desc?: string
  exercises?: Array<{ name: string; sets: string; videoUrl?: string }>
}

type AnalysisResult = {
  main: RoutinePreview
  optional?: {
    type: string
    desc: string
    exercises: Array<{ name: string; sets: string; videoUrl?: string }>
  } | null
}

function simulateBiomarkers(stress: number, fatigue: number, sleepQuality: number) {
  const sleepPenalty = sleepQuality <= 4 ? 8 : sleepQuality <= 6 ? 4 : 0
  const rmssd = Math.max(
    15,
    Math.min(85, 85 - stress * 5 - fatigue * 4 - sleepPenalty)
  )
  const sRPE_previous = fatigue >= 7 ? 9 : fatigue <= 3 ? 3 : 6
  return { rmssd, sRPE_previous }
}

const DAY_CONTEXTS: {
  value: DayContext
  label: string
  icon: React.ReactNode
  activeClass: string
}[] = [
  {
    value: 'Libre',
    label: 'Día Libre',
    icon: <Coffee className="mb-1 h-5 w-5" />,
    activeClass: 'border-teal-500 bg-teal-50 text-teal-700',
  },
  {
    value: 'Normal',
    label: 'Normal',
    icon: <Briefcase className="mb-1 h-5 w-5" />,
    activeClass: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    value: 'Pesado',
    label: 'Pesado',
    icon: <Mountain className="mb-1 h-5 w-5" />,
    activeClass: 'border-amber-500 bg-amber-50 text-amber-700',
  },
]

function useLocationAndWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationName, setLocationName] = useState('Buscando satélites...')
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('searching')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (!('geolocation' in navigator)) {
      queueMicrotask(() => {
        if (!mountedRef.current) return
        setLocationName('GPS no soportado')
        setLocationStatus('error')
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const [weatherRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            ),
          ])
          const [weatherJson, geoJson] = await Promise.all([weatherRes.json(), geoRes.json()])

          if (!mountedRef.current) return
          setWeatherData(weatherJson.current_weather ?? null)
          const parts = [
            geoJson.address?.neighbourhood ?? geoJson.address?.suburb,
            geoJson.address?.city ?? geoJson.address?.town,
          ].filter(Boolean)
          setLocationName(parts.join(', ') || 'Ubicación detectada')
          setLocationStatus('found')
        } catch {
          if (!mountedRef.current) return
          setLocationName('Ubicación no disponible')
          setLocationStatus('error')
        }
      },
      () => {
        if (!mountedRef.current) return
        setLocationName('GPS inactivo')
        setLocationStatus('error')
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { weatherData, locationName, locationStatus }
}

interface SliderFieldProps {
  label: string
  value: number[]
  onChange: (v: number[]) => void
  max: number
  step: number
  unit?: string
  icon: React.ReactNode
  colorClass: string
  textClass: string
  disabled?: boolean
}

function SliderField({
  label,
  value,
  onChange,
  max,
  step,
  unit = '/10',
  icon,
  colorClass,
  textClass,
  disabled,
}: SliderFieldProps) {
  return (
    <div className={`${colorClass} rounded-2xl border border-white/60 p-3`}>
      <div className="mb-2 flex justify-between">
        <span className={`flex items-center gap-1 text-xs font-bold ${textClass}`}>
          {icon} {label}
        </span>
        <span className="text-xs font-bold text-slate-700">
          {value[0]}
          {unit}
        </span>
      </div>
      <Slider value={value} onValueChange={onChange} max={max} step={step} disabled={disabled} />
    </div>
  )
}

export default function BalanceCard({ userId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { weatherData, locationName, locationStatus } = useLocationAndWeather()

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sleep, setSleep] = useState([7])
  const [sleepQuality, setSleepQuality] = useState([7])
  const [stress, setStress] = useState([5])
  const [fatigue, setFatigue] = useState([5])
  const [soreness, setSoreness] = useState([2])
  const [dayContext, setDayContext] = useState<DayContext>('Normal')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [profileContext, setProfileContext] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState(5)
  const [academicPhase, setAcademicPhase] = useState<string>('none')
  const [nearestExam, setNearestExam] = useState<{
    title: string
    daysUntil: number
    eventType: 'exam' | 'delivery'
  } | null>(null)
  const previousInputsRef = useRef<string | null>(null)

  useEffect(() => {
    async function loadContext() {
      const [{ data: profile }, { data: events }] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'gender, employment_status, caregiver_status, fitness_level, sleep_quality_baseline'
          )
          .eq('id', userId)
          .single(),
        supabase
          .from('academic_events')
          .select('title, event_type, event_date')
          .eq('user_id', userId)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true }),
      ])

      if (profile) {
        setProfileContext(buildUserContext(profile))
        if (profile.fitness_level != null) setFitnessLevel(profile.fitness_level)
        if (profile.sleep_quality_baseline != null) {
          setSleepQuality([profile.sleep_quality_baseline])
        }
      }

      const nearest = getNearestUpcomingEvent(events ?? [])
      if (nearest) {
        setNearestExam({
          title: nearest.title,
          daysUntil: nearest.daysUntil,
          eventType: nearest.eventType,
        })
        setAcademicPhase(getAcademicLoadPhase(nearest.daysUntil))
      }
    }

    void loadContext()
  }, [supabase, userId])

  useEffect(() => {
    const currentInputs = JSON.stringify({
      sleep,
      sleepQuality,
      stress,
      fatigue,
      soreness,
      dayContext,
    })
    if (previousInputsRef.current !== null && previousInputsRef.current !== currentInputs) {
      setError(null)
    }
    previousInputsRef.current = currentInputs
  }, [sleep, sleepQuality, stress, fatigue, soreness, dayContext])

  const handleVoiceProcessed = useCallback((data: VoiceAnalysisData) => {
    if (!data) return
    if (data.sleep !== undefined) setSleep([data.sleep])
    if (data.stress !== undefined) setStress([data.stress])
    if (data.fatigue !== undefined) setFatigue([data.fatigue])
    if (data.soreness !== undefined) setSoreness([data.soreness])
    setTimeout(() => setStep(2), 500)
  }, [])

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const today = new Date().toISOString().split('T')[0]

      const { error: upsertErr } = await supabase.from('daily_logs').upsert(
        {
          user_id: userId,
          log_date: today,
          sleep_hours: sleep[0],
          sleep_quality: sleepQuality[0],
          stress_level: stress[0],
          fatigue_level: fatigue[0],
          soreness_level: soreness[0],
          day_context: dayContext,
        },
        { onConflict: 'user_id, log_date' }
      )
      if (upsertErr) throw new Error('Error guardando biomarcadores: ' + upsertErr.message)

      const { rmssd, sRPE_previous } = simulateBiomarkers(stress[0], fatigue[0], sleepQuality[0])

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleepHours: sleep[0],
          sleepQuality: sleepQuality[0],
          stressLevel: stress[0],
          fatigueLevel: fatigue[0],
          sorenessLevel: soreness[0],
          fitnessLevel,
          weather: weatherData,
          location: locationName,
          rmssd,
          sRPE_previous,
          dayContext,
          userContext: profileContext,
          daysUntilExam: nearestExam?.daysUntil ?? null,
          nearestExamTitle: nearestExam?.title ?? null,
          nearestExamType: nearestExam?.eventType ?? null,
          academicLoadPhase: academicPhase,
        }),
      })
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)

      const recommendation = (await res.json()) as AnalysisResult

      const { error: routineErr } = await supabase
        .from('daily_logs')
        .update({ suggested_routine: recommendation })
        .eq('user_id', userId)
        .eq('log_date', today)
      if (routineErr) throw new Error('Error guardando rutina: ' + routineErr.message)

      setAnalysisResult(recommendation)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      console.error('❌ BalanceCard error:', e)
    } finally {
      setLoading(false)
    }
  }

  const inExamWeek = nearestExam ? isExamWeek(nearestExam.daysUntil) : false

  return (
    <div className="space-y-6">
      {nearestExam && inExamWeek && (
        <div className="clinical-alert animate-in fade-in slide-in-from-top-2">
          <Shield className="h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Modo descompresión activo — {formatAcademicPhaseLabel(getAcademicLoadPhase(nearestExam.daysUntil))}
            </p>
            <p className="mt-1 text-xs text-amber-800/90">
              {nearestExam.title} en {nearestExam.daysUntil} día(s). Se reducirá la carga física.
            </p>
          </div>
        </div>
      )}

      <Card className="clinical-card overflow-hidden border-none">
        <CardContent className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge className="clinical-badge">
                  <Sparkles className="mr-1 h-3 w-3" /> Inferencia Activa
                </Badge>
              </div>
              <h2 className="clinical-title text-xl">Check-in Diario</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex max-w-[90%] items-center gap-1.5 truncate rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">
                  {locationStatus === 'searching' ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">{locationName}</span>
                </div>
              </div>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="clinical-section border-teal-50 bg-gradient-to-br from-slate-50 to-teal-50/40 text-center">
                <p className="clinical-label mb-4">Asistente de Prior Bayesiano</p>
                <h3 className="mb-2 text-lg font-bold text-slate-800">
                  ¿Cómo responde tu cuerpo hoy?
                </h3>
                <VoiceLogger onProcessed={handleVoiceProcessed} />
                <p className="mt-4 text-xs italic text-slate-400">
                  &quot;Dormí 6 horas, calidad regular, estrés por examen...&quot;
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full text-xs text-slate-400"
                onClick={() => setStep(2)}
              >
                Entrada manual de biomarcadores
              </Button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 fade-in space-y-6">
              <div>
                <p className="clinical-label mb-3">Contexto de tu jornada</p>
                <div className="grid grid-cols-3 gap-2">
                  {DAY_CONTEXTS.map(({ value, label, icon, activeClass }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDayContext(value)}
                      disabled={!!analysisResult}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all ${
                        dayContext === value
                          ? activeClass
                          : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                      } ${analysisResult ? 'opacity-50' : ''}`}
                    >
                      {icon}
                      <span className="text-[10px] font-bold uppercase">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="clinical-label mb-3">Biomarcadores y moderadores del día</p>
                <div className="grid grid-cols-2 gap-3">
                  <SliderField
                    label="Horas sueño"
                    value={sleep}
                    onChange={setSleep}
                    max={12}
                    step={0.5}
                    unit="h"
                    icon={<Moon className="h-3 w-3" />}
                    colorClass="bg-blue-50/80"
                    textClass="text-blue-700"
                    disabled={!!analysisResult}
                  />
                  <SliderField
                    label="Calidad sueño"
                    value={sleepQuality}
                    onChange={setSleepQuality}
                    max={10}
                    step={1}
                    icon={<Moon className="h-3 w-3" />}
                    colorClass="bg-indigo-50/80"
                    textClass="text-indigo-700"
                    disabled={!!analysisResult}
                  />
                  <SliderField
                    label="Estrés"
                    value={stress}
                    onChange={setStress}
                    max={10}
                    step={1}
                    icon={<Zap className="h-3 w-3" />}
                    colorClass="bg-amber-50/80"
                    textClass="text-amber-700"
                    disabled={!!analysisResult}
                  />
                  <SliderField
                    label="Fatiga"
                    value={fatigue}
                    onChange={setFatigue}
                    max={10}
                    step={1}
                    icon={<Activity className="h-3 w-3" />}
                    colorClass="bg-slate-100/80"
                    textClass="text-slate-600"
                    disabled={!!analysisResult}
                  />
                  <SliderField
                    label="Dolor"
                    value={soreness}
                    onChange={setSoreness}
                    max={10}
                    step={1}
                    icon={<HeartPulse className="h-3 w-3" />}
                    colorClass="bg-rose-50/80"
                    textClass="text-rose-700"
                    disabled={!!analysisResult}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!analysisResult ? (
                <Button
                  className="h-12 w-full rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando Inferencia
                      Activa...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" /> Procesar Plan IA
                    </>
                  )}
                </Button>
              ) : (
                <div className="rounded-xl border border-teal-100 bg-teal-50 p-2 text-center text-xs font-bold uppercase tracking-widest text-teal-700">
                  Análisis completado con éxito
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
          <AnalysisPreviewCard plan={analysisResult.main} />

          <Button
            onClick={() => {
              router.push('/workout')
              router.refresh()
            }}
            className="clinical-button flex h-16 w-full items-center justify-center gap-2 text-base shadow-lg shadow-teal-900/20 group"
          >
            INICIAR MODO EJECUCIÓN
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
