'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Moon, Activity, Mic, MicOff, Brain, ArrowLeft, Battery, Dumbbell, Timer, Gauge } from 'lucide-react'
import Link from 'next/link'

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function LogPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // --- ESTADOS ---
  const [sleep, setSleep] = useState(7)
  const [stress, setStress] = useState(3)
  const [fatigue, setFatigue] = useState(3)
  const [soreness, setSoreness] = useState(1)
  
  // VARIABLES DE TESIS: RPE y DURACIÓN
  const [rpe, setRpe] = useState(5)
  const [duration, setDuration] = useState(60)
  
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("Toca el micrófono y cuéntame cómo estás...")
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  
  const getBackgroundColor = () => {
    const totalLoad = stress + fatigue + soreness + (12 - sleep);
    if (totalLoad < 15) return "bg-emerald-50"
    if (totalLoad < 25) return "bg-amber-50"
    return "bg-rose-50"
  }

  // --- LÓGICA DE VOZ ---
  const toggleListening = () => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta voz.")
      return
    }

    if (isListening) {
      setIsListening(false)
      analyzeSentiment(voiceText)
    } else {
      setIsListening(true)
      const recognition = new window.webkitSpeechRecognition()
      recognition.lang = 'es-AR'
      recognition.continuous = false
      recognition.interimResults = true

      let finalTranscript = ""; 
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        finalTranscript = transcript
        setVoiceText(transcript)
        setNotes(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (finalTranscript) analyzeSentiment(finalTranscript)
      }
      recognition.start()
    }
  }

  const analyzeSentiment = (text: string) => {
    const lower = text.toLowerCase()
    let parts = []
    if (lower.includes("duelen") || lower.includes("molestia")) { setSoreness(8); parts.push("Dolor"); }
    if (lower.includes("cansado") || lower.includes("agotado")) { setFatigue(9); parts.push("Fatiga"); }
    if (lower.includes("estrés") || lower.includes("trabajo")) { setStress(9); parts.push("Estrés"); }
    setAiAnalysis(parts.length > 0 ? "Detectado: " + parts.join(", ") : "Registro listo.")
  }

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const date = new Date().toISOString().split('T')[0] 
      
      const { error } = await supabase.from('daily_logs').upsert({ 
          user_id: user.id,
          log_date: date,
          sleep_hours: sleep,
          stress_level: stress,
          fatigue_level: fatigue,
          soreness_level: soreness,
          rpe_score: rpe,        // NUEVO: Escala de Borg
          session_duration: duration, // NUEVO: Minutos
          notes: notes
      }, { onConflict: 'user_id, log_date' })

      if (error) {
        console.error(error)
        alert("Error al guardar. ¿Creaste las columnas rpe_score y session_duration?")
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-4 pb-32 ${getBackgroundColor()}`}>
      
      <div className="flex items-center gap-4 mb-6 pt-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 shadow-sm"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Finalizar Día</h1>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        
        {/* ASISTENTE DE VOZ */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
            <button onClick={toggleListening} className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${isListening ? "bg-rose-500 animate-pulse" : "bg-teal-600 shadow-lg shadow-teal-600/20"}`}>
              {isListening ? <MicOff className="text-white" /> : <Mic className="text-white" />}
            </button>
            <p className="text-sm italic text-stone-500 text-center">"{voiceText}"</p>
          </CardContent>
        </Card>

        {/* SECCIÓN CRÍTICA DE TESIS: CARGA DE ENTRENAMIENTO */}
        <div className="bg-stone-800 text-white p-6 rounded-[32px] shadow-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Gauge className="h-5 w-5 text-teal-400" />
                <h3 className="font-bold uppercase text-xs tracking-widest">Carga de la Sesión</h3>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-medium text-stone-400">Esfuerzo (RPE 1-10)</label>
                    <span className="text-3xl font-black text-teal-400">{rpe}</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={rpe} onChange={(e) => setRpe(parseInt(e.target.value))} className="w-full h-3 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-teal-400" />
                <div className="flex justify-between text-[10px] text-stone-500 font-bold uppercase">
                    <span>Muy Suave</span>
                    <span>Máximo</span>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                    <label className="text-sm font-medium text-stone-400 flex items-center gap-2"><Timer className="h-4 w-4" /> Duración (min)</label>
                    <span className="text-xl font-bold">{duration} min</span>
                </div>
                <input type="range" min="15" max="180" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-white" />
            </div>
        </div>

        {/* OTROS SLIDERS (SUEÑO, ESTRÉS, ETC) */}
        <div className="grid gap-4 grid-cols-2">
            <Card className="border-none shadow-sm bg-white/70 p-4">
                <div className="flex justify-between mb-2 text-xs font-bold text-stone-500 uppercase"><Moon className="h-3 w-3" /> Sueño</div>
                <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                <div className="text-center font-bold mt-1 text-indigo-900">{sleep}h</div>
            </Card>
            <Card className="border-none shadow-sm bg-white/70 p-4">
                <div className="flex justify-between mb-2 text-xs font-bold text-stone-500 uppercase"><Battery className="h-3 w-3" /> Fatiga</div>
                <input type="range" min="1" max="10" step="1" value={fatigue} onChange={(e) => setFatigue(parseInt(e.target.value))} className="w-full accent-amber-600" />
                <div className="text-center font-bold mt-1 text-amber-900">{fatigue}/10</div>
            </Card>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-stone-900 hover:bg-black text-white font-bold h-16 rounded-2xl shadow-xl text-lg transition-all active:scale-95">
            {loading ? "Guardando..." : "Confirmar y Finalizar Día"}
        </Button>

      </div>
    </div>
  )
}