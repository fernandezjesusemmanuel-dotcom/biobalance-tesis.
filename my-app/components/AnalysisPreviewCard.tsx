// Componente: AnalysisPreviewCard.tsx
import { Brain, Zap, Target, ArrowRight } from 'lucide-react'

interface PreviewProps {
  plan: {
    type: string
    intensity: string
    justification: string
  }
}

export function AnalysisPreviewCard({ plan }: PreviewProps) {
  const isHigh = plan.intensity === 'Alta'
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Brain className="h-5 w-5 text-teal-600" />
          </div>
          <h3 className="font-black text-stone-800 uppercase tracking-tighter">Resumen del Análisis</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-400">TIPO DE SESIÓN</span>
            <span className="text-sm font-black text-stone-900">{plan.type}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-400">INTENSIDAD SUGERIDA</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              isHigh ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'
            }`}>
              {plan.intensity}
            </span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <p className="text-xs italic text-stone-600 leading-relaxed">
              "{plan.justification}"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}