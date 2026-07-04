'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from 'lucide-react'

type VoiceAnalysisData = {
  sleep: number
  stress: number
  fatigue: number
  soreness: number
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  length: number
  isFinal: boolean
}

interface SpeechRecognitionResultList {
  0: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

interface Props {
  onProcessed: (data: VoiceAnalysisData) => void;
}

export default function VoiceLogger({ onProcessed }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)

  const analyzeTextWithAI = useCallback((text: string) => {
    setAnalyzing(true)

    const data: VoiceAnalysisData = {
      sleep: 7,
      stress: 5,
      fatigue: 5,
      soreness: 2
    }

    const lowerText = text.toLowerCase()

    if (lowerText.includes("dormí bien") || lowerText.includes("descansé")) data.sleep = 8
    if (lowerText.includes("dormí mal") || lowerText.includes("poco sueño")) data.sleep = 5
    if (lowerText.includes("insomnio")) data.sleep = 3

    const horasMatch = lowerText.match(/(\d+)\s+horas?/)
    if (horasMatch) data.sleep = parseFloat(horasMatch[1])

    if (lowerText.includes("estresado") || lowerText.includes("nervioso")) data.stress = 8
    if (lowerText.includes("tranquilo") || lowerText.includes("relajado")) data.stress = 2
    if (lowerText.includes("mucho trabajo") || lowerText.includes("examen")) data.stress = 9

    if (lowerText.includes("cansado") || lowerText.includes("muerto")) data.fatigue = 8
    if (lowerText.includes("energía") || lowerText.includes("fresco")) data.fatigue = 3

    if (lowerText.includes("duele") || lowerText.includes("molestia")) data.soreness = 6
    if (lowerText.includes("agujetas") || lowerText.includes("dolor muscular")) data.soreness = 7

    setTimeout(() => {
      setAnalyzing(false)
      onProcessed(data)
    }, 1500)
  }, [onProcessed])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const speechWindow = window as WindowWithSpeechRecognition
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.lang = 'es-ES'
        recognitionInstance.interimResults = false

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const text = event.results[0][0].transcript
          setTranscript(text)
          analyzeTextWithAI(text)
        }

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Error de voz:", event.error)
          setIsRecording(false)
        }

        recognitionInstance.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognitionInstance
      }
    }
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [analyzeTextWithAI])

  const toggleRecording = () => {
    const recognition = recognitionRef.current
    if (!recognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }

    if (!isRecording) {
      setTranscript("")
      recognition.start();
      setIsRecording(true);
    } else {
      recognition.stop();
      setIsRecording(false);
    }
  }

  return (
    <div className="flex flex-col items-center my-4 gap-3">
      {analyzing ? (
        <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center border-4 border-teal-500 border-t-transparent animate-spin">
                <Loader2 className="h-8 w-8 text-teal-600" />
            </div>
            <p className="text-xs font-bold text-teal-600">{`Procesando: "${transcript}"`}</p>
        </div>
      ) : (
        <>
            <Button 
                onClick={toggleRecording}
                className={`h-20 w-20 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    isRecording 
                    ? 'bg-rose-500 hover:bg-rose-600 animate-pulse ring-4 ring-rose-200' 
                    : 'bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600'
                }`}
            >
                {isRecording ? <Square className="h-8 w-8 fill-white" /> : <Mic className="h-8 w-8" />}
            </Button>
            {transcript && <p className="text-xs text-stone-500 italic text-center max-w-[200px]">{`"${transcript}"`}</p>}
        </>
      )}
    </div>
  )
}