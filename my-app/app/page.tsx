import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import RecommendationCard from '@/components/dashboard/RecommendationCard'
import TrendChart from '@/components/dashboard/TrendChart'
import { ArrowDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, avatar_url')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  
  const { data: dailyLog } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)
    .single()

  const hasRoutine = dailyLog && dailyLog.suggested_routine;

  const { data: history } = await supabase
    .from('daily_logs')
    .select('log_date, sleep_hours, stress_level, fatigue_level')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(7)

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      
      <Header 
        userName={profile?.first_name || 'Atleta'} 
        userImage={profile?.avatar_url}
        userId={user.id}
      />

      <div className="px-6 -mt-8 relative z-20 space-y-8">
        
        {/* ZONA PRINCIPAL */}
        {hasRoutine ? (
            // CASO A: YA TENEMOS RUTINA
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <RecommendationCard 
                    dailyLog={dailyLog} 
                    userId={user.id}
                />
            </div>
        ) : (
            // CASO B: NO HAY DATOS (Estado Vacío Bonito)
            <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-100 animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">😴</span>
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">Sin registros hoy</h3>
                <p className="text-stone-500 text-sm mb-6">
                    Aún no has generado tu plan de entrenamiento inteligente.
                </p>
                
                <div className="flex flex-col items-center justify-center gap-2 text-teal-600 animate-bounce">
                    <span className="text-xs font-bold uppercase tracking-widest">Toca el + para empezar</span>
                    <ArrowDown className="h-5 w-5" />
                </div>
            </div>
        )}

        {/* Gráfico de Evolución */}
        <div className="pt-4 border-t border-stone-200">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">
                Tu Evolución
            </h3>
            <TrendChart data={history || []} />
        </div>

      </div>
    </div>
  )
}