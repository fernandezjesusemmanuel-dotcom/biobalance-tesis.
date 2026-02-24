'use client'

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Activity, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function TrendChart({ data }: { data: any[] }) {
  
  // 1. VALIDACIÓN: Si no hay datos suficientes
  if (!data || data.length < 2) {
    return (
        <Card className="shadow-sm border-stone-100 bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center h-64 text-center">
                <div className="bg-stone-50 p-4 rounded-full mb-3">
                    <Activity className="h-8 w-8 text-stone-300" />
                </div>
                <h3 className="text-sm font-bold text-stone-600">Faltan Datos</h3>
                <p className="text-xs text-stone-400 mb-4 max-w-[250px]">
                    Registra al menos 2 días para ver tu evolución clínica.
                </p>
                <Link href="/log">
                    <button className="text-xs bg-teal-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-sm">
                        <PlusCircle className="h-3 w-3" /> Registrar Hoy
                    </button>
                </Link>
            </CardContent>
        </Card>
    )
  }

  // 2. PROCESAMIENTO DE DATOS
  const chartData = data.slice(0, 7).reverse(); 
  
  const points = chartData.map((d, i) => {
      // Eje X (0 a 100%)
      const x = (i / (chartData.length - 1)) * 100;
      
      // Eje Y (Alturas en %)
      // Sueño (Base 10h)
      const sleepVal = Math.min(((d.sleep_hours || 0) / 10) * 80, 100) + 10;
      // Estrés (Base 10)
      const stressVal = Math.min(((d.stress_level || 0) / 10) * 80, 100) + 10;
      // Fatiga (Base 10)
      const fatigueVal = Math.min(((d.fatigue_level || 0) / 10) * 80, 100) + 10;

      return {
          date: new Date(d.log_date).toLocaleDateString('es-ES', { weekday: 'narrow' }),
          x, 
          // Posición HTML (bottom)
          hSleep: sleepVal,
          hStress: stressVal,
          hFatigue: fatigueVal,
          // Posición SVG (y = 100 - val)
          sSleep: 100 - sleepVal,
          sStress: 100 - stressVal,
          sFatigue: 100 - fatigueVal,
          // Valores reales para mostrar en texto
          raw: d
      };
  });

  // Generar líneas SVG
  const pathSleep = points.map(p => `${p.x},${p.sSleep}`).join(" ");
  const pathStress = points.map(p => `${p.x},${p.sStress}`).join(" ");
  const pathFatigue = points.map(p => `${p.x},${p.sFatigue}`).join(" ");

  return (
    <Card className="shadow-sm border-stone-100 bg-white overflow-hidden">
        <CardContent className="p-6">
            
            {/* CABECERA */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xs font-black text-stone-700 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        Evolución Clínica
                    </h3>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] font-bold text-stone-500">Sueño</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-bold text-stone-500">Estrés</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[9px] font-bold text-stone-500">Fatiga</span></div>
                </div>
            </div>

            {/* GRÁFICO */}
            <div className="relative h-56 w-full px-3">
                
                {/* 1. GRILLA DE FONDO */}
                <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-stone-300 font-mono pointer-events-none z-0">
                    {[10, 7.5, 5, 2.5, 0].map((v, i) => (
                        <div key={i} className="w-full h-px bg-stone-100 relative">
                            <span className="absolute -top-2 -left-4 text-[8px] text-stone-300">{v}</span>
                        </div>
                    ))}
                </div>

                {/* 2. LÍNEAS SVG */}
                <svg className="absolute inset-0 w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points={pathSleep} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={pathStress} fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={pathFatigue} fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* 3. PUNTOS HTML (SIN DEFORMACIÓN) */}
                <div className="absolute inset-0 z-20">
                    {points.map((p, i) => (
                        <div key={i} className="absolute h-full w-8 -ml-4 flex flex-col justify-end group cursor-pointer" style={{ left: `${p.x}%` }}>
                            
                            {/* Hover Area Invisible */}
                            <div className="absolute inset-0 bg-transparent"></div>

                            {/* TOOLTIP FLOTANTE */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-stone-900/95 backdrop-blur text-white text-[10px] p-2.5 rounded-xl shadow-xl min-w-[90px] pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
                                <div className="flex justify-between mb-1"><span className="text-blue-300 font-bold">Sueño</span><span>{p.raw.sleep_hours}h</span></div>
                                <div className="flex justify-between mb-1"><span className="text-amber-300 font-bold">Estrés</span><span>{p.raw.stress_level}</span></div>
                                <div className="flex justify-between pt-1 border-t border-white/10"><span className="text-rose-300 font-bold">Fatiga</span><span>{p.raw.fatigue_level}</span></div>
                            </div>

                            {/* PUNTOS CIRCULARES (Centrados con transform) */}
                            
                            {/* Punto Sueño */}
                            <div 
                                className="absolute left-1/2 w-2.5 h-2.5 bg-white border-[2px] border-blue-500 rounded-full shadow-sm z-30 transition-transform group-hover:scale-150" 
                                style={{ bottom: `${p.hSleep}%`, transform: 'translate(-50%, 50%)' }}
                            />
                            
                            {/* Punto Estrés */}
                            <div 
                                className="absolute left-1/2 w-2.5 h-2.5 bg-white border-[2px] border-amber-500 rounded-full shadow-sm z-30 transition-transform group-hover:scale-150" 
                                style={{ bottom: `${p.hStress}%`, transform: 'translate(-50%, 50%)' }}
                            />

                            {/* Punto Fatiga */}
                            <div 
                                className="absolute left-1/2 w-2.5 h-2.5 bg-white border-[2px] border-rose-500 rounded-full shadow-sm z-30 transition-transform group-hover:scale-150" 
                                style={{ bottom: `${p.hFatigue}%`, transform: 'translate(-50%, 50%)' }}
                            />

                            {/* ETIQUETA DÍA */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center">
                                <span className="text-[9px] font-bold text-stone-400 uppercase bg-white px-1">{p.date}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </CardContent>
    </Card>
  )
}