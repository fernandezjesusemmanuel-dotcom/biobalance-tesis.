'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Moon, Activity, Mic, MicOff, Sparkles, Brain, ArrowLeft, Battery, Dumbbell } from 'lucide-react'
import Link from 'next/link'

// Declaración para evitar errores de TypeScript con la API de voz
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
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("Toca el micrófono y cuéntame cómo estás...")
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  
  // Color de fondo dinámico
  const getBackgroundColor = () => {
    const totalLoad = stress + fatigue + soreness + (12 - sleep);
    if (totalLoad < 15) return "bg-emerald-50"
    if (totalLoad < 25) return "bg-amber-50"
    return "bg-rose-50"
  }

  // --- LÓGICA DE VOZ (CORREGIDA) ---
  const toggleListening = () => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
      alert("Tu navegador no soporta voz. Intenta en Chrome o Android.")
      return
    }

    if (isListening) {
      setIsListening(false)
      // Si paramos manual, analizamos lo que haya en el estado
      analyzeSentiment(voiceText)
    } else {
      setIsListening(true)
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition()
      recognition.lang = 'es-AR'
      recognition.continuous = false
      recognition.interimResults = true

      // Variable local para capturar el texto en tiempo real sin depender del estado de React
      let finalTranscript = ""; 

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        finalTranscript = transcript // Guardamos en variable local
        setVoiceText(transcript)     // Actualizamos visualmente
        setNotes(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
        // IMPORTANTE: Pasamos la variable local, no el estado
        if (finalTranscript) {
            analyzeSentiment(finalTranscript)
        }
      }

      recognition.start()
    }
  }

  // --- EL CEREBRO DE BIOBALANCE (Diccionario Ampliado) ---
  const analyzeSentiment = (text: string) => {
    console.log("Analizando texto:", text) // Para depurar en consola
    const lower = text.toLowerCase()
    let analysisParts = []

    // 1. Detectar Dolor Muscular
    // Agregamos: "duele" (singular), "todo", "cuerpo", "molestia"
    if (lower.includes("duelen") || lower.includes("duele") || lower.includes("todo") || lower.includes("cuerpo") || lower.includes("roto") || lower.includes("agujetas") || lower.includes("molestia")) {
        setSoreness(8) // Sube el dolor a 8
        analysisParts.push("Dolor muscular")
    }

    // 2. Detectar Fatiga/Cansancio
    if (lower.includes("cansado") || lower.includes("agotado") || lower.includes("muerto") || lower.includes("sin energía") || lower.includes("fatiga") || lower.includes("destruido")) {
        setFatigue(9) // Sube la fatiga a 9
        analysisParts.push("Fatiga alta")
    }

    // 3. Detectar Estrés
    if (lower.includes("estrés") || lower.includes("nervioso") || lower.includes("trabajo") || lower.includes("examen") || lower.includes("locura") || lower.includes("ansiedad") || lower.includes("muchas cosas")) {
        setStress(9) // Sube estrés a 9
        analysisParts.push("Estrés elevado")
    }

    // 4. Detectar Sueño
    if (lower.includes("dormí mal") || lower.includes("poco sueño") || lower.includes("desvele") || lower.includes("insomnio")) {
        setSleep(4) // Baja sueño a 4
        analysisParts.push("Mala noche")
    } else if (lower.includes("dormí bien") || lower.includes("descansé") || lower.includes("fresco")) {
        setSleep(8)
        setFatigue(2)
        analysisParts.push("Buen descanso")
    }

    if (analysisParts.length > 0) {
        setAiAnalysis("Detectado: " + analysisParts.join(", ") + ".")
    } else {
        setAiAnalysis("Registro completado.")
    }
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
            notes: notes
        }, { onConflict: 'user_id, log_date' })

        if (error) console.error(error)
        
        router.push('/')
        router.refresh()
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 p-4 pb-32 ${getBackgroundColor()}`}>
      
      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/50 hover:bg-white shadow-sm">
                <ArrowLeft className="h-6 w-6 text-stone-600" />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold text-stone-800">Check-in Diario</h1>
      </div>

      {/* --- EL ORÁCULO (Aparece si la fatiga es alta) --- */}
      {fatigue > 7 && (
          <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-700">
            <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-xl flex gap-4 items-center border border-indigo-700">
                <div className="bg-indigo-700 p-2 rounded-full shrink-0 animate-pulse">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-200">Alerta BioBalance</h3>
                    <p className="text-sm font-medium leading-tight mt-1">
                        Tu fatiga es alta ({fatigue}/10). Se recomienda sesión regenerativa hoy.
                    </p>
                </div>
            </div>
          </div>
      )}

      <div className="space-y-6 max-w-lg mx-auto">
        
        {/* --- DESAHOGO POR VOZ --- */}
        <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-md">
            <CardContent className="flex flex-col items-center gap-4 pt-6 pb-6">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase text-teal-600 tracking-widest mb-1">Asistente IA</p>
                    <h2 className="text-lg font-semibold text-stone-700">¿Cómo te sientes hoy?</h2>
                </div>
                
                <button 
                    onClick={toggleListening}
                    className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                        isListening 
                        ? "bg-rose-500 scale-110 ring-4 ring-rose-200 shadow-rose-500/30" 
                        : "bg-teal-600 hover:bg-teal-700 hover:scale-105 shadow-teal-600/30"
                    }`}
                >
                    {isListening ? (
                        <MicOff className="h-8 w-8 text-white animate-pulse" />
                    ) : (
                        <Mic className="h-8 w-8 text-white" />
                    )}
                </button>

                <div className="text-center w-full min-h-[3rem]">
                    <p className={`text-sm italic transition-all ${isListening ? "text-stone-800 font-medium" : "text-stone-400"}`}>
                        "{voiceText}"
                    </p>
                    {aiAnalysis && (
                        <span className="inline-flex items-center gap-1 mt-2 text-[10px] bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-bold animate-in zoom-in">
                            <Brain className="h-3 w-3" /> {aiAnalysis}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* --- SLIDERS --- */}
        <div className="grid gap-4 sm:grid-cols-2">
            
            {/* 1. SUEÑO */}
            <Card className="border-none shadow-sm bg-white/70">
                <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                            <Moon className="h-4 w-4" /> Sueño
                        </div>
                        <span className="text-lg font-bold text-stone-700">{sleep}h</span>
                    </div>
                    <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </CardContent>
            </Card>

            {/* 2. ESTRÉS */}
            <Card className="border-none shadow-sm bg-white/70">
                <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                            <Activity className="h-4 w-4" /> Estrés
                        </div>
                        <span className="text-lg font-bold text-stone-700">{stress}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={stress} onChange={(e) => setStress(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                </CardContent>
            </Card>

            {/* 3. FATIGA */}
            <Card className="border-none shadow-sm bg-white/70">
                <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                            <Battery className="h-4 w-4" /> Fatiga
                        </div>
                        <span className="text-lg font-bold text-stone-700">{fatigue}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={fatigue} onChange={(e) => setFatigue(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                </CardContent>
            </Card>

            {/* 4. DOLOR MUSCULAR */}
            <Card className="border-none shadow-sm bg-white/70">
                <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                            <Dumbbell className="h-4 w-4" /> Dolor
                        </div>
                        <span className="text-lg font-bold text-stone-700">{soreness}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={soreness} onChange={(e) => setSoreness(parseInt(e.target.value))} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600" />
                </CardContent>
            </Card>

        </div>

        {/* Botón Guardar */}
        <Button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-black text-white font-bold h-14 rounded-2xl shadow-xl text-lg transition-transform active:scale-95"
        >
            {loading ? "Guardando..." : "Confirmar Día"}
        </Button>

      </div>
    </div>
  )
}