'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Activity, Quote } from 'lucide-react'
import Link from 'next/link'

interface Props { dailyLog: any; userId: string; }

export default function RecommendationCard({ dailyLog, userId }: Props) {
  const fullRoutine = dailyLog?.suggested_routine
  const mainRoutine = fullRoutine?.main || fullRoutine
  
  if (!mainRoutine) return null

  const isRecovery = mainRoutine.intensity === 'Baja'
  const bgColor = isRecovery ? 'bg-teal-50 border-teal-100' : 'bg-stone-900 border-stone-800'
  const textColor = isRecovery ? 'text-teal-900' : 'text-white'
  const subTextColor = isRecovery ? 'text-teal-600' : 'text-stone-400'
  const btnColor = isRecovery ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-white hover:bg-stone-200 text-black'

  return (
    <div className="pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* MENSAJE MOTIVACIONAL */}
        {fullRoutine.motivational_message && (
            <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden">
                <Quote className="absolute -top-2 -left-2 h-12 w-12 text-stone-100 rotate-180" />
                <p className="text-stone-700 font-medium italic relative z-10 leading-relaxed text-sm">
                    "{fullRoutine.motivational_message}"
                </p>
            </div>
        )}

        {/* TARJETA RESUMEN */}
        <Card className={`border shadow-xl overflow-hidden ${bgColor}`}>
            <CardContent className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-2 inline-block ${isRecovery ? 'bg-teal-200/50 text-teal-800' : 'bg-white/10 text-stone-300'}`}>
                                DIAGNÓSTICO IA • INTENSIDAD {mainRoutine.intensity || "MEDIA"}
                            </span>
                            <h2 className={`text-2xl font-black tracking-tight ${textColor}`}>{mainRoutine.type}</h2>
                        </div>
                        <Activity className={`h-8 w-8 ${subTextColor}`} />
                    </div>
                    
                    <div className={`mt-4 p-4 rounded-xl text-sm leading-relaxed ${isRecovery ? 'bg-white/60' : 'bg-black/20'} ${textColor}`}>
                        <span className="font-bold text-xs uppercase tracking-widest opacity-70 block mb-1">Por qué y Para qué:</span>
                        {mainRoutine.justification || mainRoutine.desc}
                    </div>
                </div>

                <Link href="/workout" className="w-full">
                    <Button className={`w-full font-bold h-14 rounded-xl shadow-lg flex items-center justify-center gap-3 ${btnColor} transition-transform active:scale-95`}>
                        <Play className="h-5 w-5 fill-current" /> IR AL GIMNASIO (MODO EJECUCIÓN)
                    </Button>
                </Link>
            </CardContent>
        </Card>
    </div>
  )
}