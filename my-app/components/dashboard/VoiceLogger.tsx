'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, MicOff } from 'lucide-react'

interface Props {
  onProcessed: (data: any) => void;
}

export default function VoiceLogger({ onProcessed }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Configurar reconocimiento de voz del navegador (Solo funciona en Chrome/Edge/Brave)
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.lang = 'es-ES';
        recognitionInstance.interimResults = false;

        recognitionInstance.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          analizeTextWithAI(text); // Mandar a analizar lo que escuchó
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Error de voz:", event.error);
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const toggleRecording = () => {
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

  // AQUÍ ESTÁ LA MAGIA: Convertimos el TEXTO hablado en DATOS numéricos
  const analizeTextWithAI = (text: string) => {
    setAnalyzing(true)
    
    // Lógica simple de procesamiento de lenguaje natural (NLP)
    // Buscamos palabras clave en lo que dijiste
    const data = {
        sleep: 7, // Valor base
        stress: 5,
        fatigue: 5,
        soreness: 2
    }

    const lowerText = text.toLowerCase();

    // 1. Detectar Sueño
    if (lowerText.includes("dormí bien") || lowerText.includes("descansé")) data.sleep = 8;
    if (lowerText.includes("dormí mal") || lowerText.includes("poco sueño")) data.sleep = 5;
    if (lowerText.includes("insomnio")) data.sleep = 3;
    
    // Intentar sacar número de horas (ej: "dormí 6 horas")
    const horasMatch = lowerText.match(/(\d+)\s+horas?/);
    if (horasMatch) data.sleep = parseFloat(horasMatch[1]);

    // 2. Detectar Estrés
    if (lowerText.includes("estresado") || lowerText.includes("nervioso")) data.stress = 8;
    if (lowerText.includes("tranquilo") || lowerText.includes("relajado")) data.stress = 2;
    if (lowerText.includes("mucho trabajo") || lowerText.includes("examen")) data.stress = 9;

    // 3. Detectar Fatiga
    if (lowerText.includes("cansado") || lowerText.includes("muerto")) data.fatigue = 8;
    if (lowerText.includes("energía") || lowerText.includes("fresco")) data.fatigue = 3;

    // 4. Detectar Dolor
    if (lowerText.includes("duele") || lowerText.includes("molestia")) data.soreness = 6;
    if (lowerText.includes("agujetas") || lowerText.includes("dolor muscular")) data.soreness = 7;

    setTimeout(() => {
        setAnalyzing(false)
        onProcessed(data) // Enviamos los datos detectados
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center my-4 gap-3">
      {analyzing ? (
        <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center border-4 border-teal-500 border-t-transparent animate-spin">
                <Loader2 className="h-8 w-8 text-teal-600" />
            </div>
            <p className="text-xs font-bold text-teal-600">Procesando: "{transcript}"</p>
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
            {transcript && <p className="text-xs text-stone-500 italic text-center max-w-[200px]">"{transcript}"</p>}
        </>
      )}
    </div>
  )
}