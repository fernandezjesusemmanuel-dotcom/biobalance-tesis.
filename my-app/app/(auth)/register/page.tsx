import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import RecommendationCard from '@/components/dashboard/RecommendationCard'
import TrendChart from '@/components/dashboard/TrendChart'
import { ArrowDown, AlertTriangle, ShieldCheck, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.first_name || !profile.age) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]
  
  // 1. Obtener logs para ACWR (Últimos 28 días)
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('rpe_score, session_duration, log_date')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(28)

  // --- LÓGICA ACWR (Métrica de Tesis) ---
  let acwrRatio = 0;
  let statusMessage = "Recolectando datos...";
  let statusColor = "bg-white text-stone-800 border-stone-100";

  if (logs && logs.length >= 7) {
    const calculateWorkload = (data: any[]) => data.reduce((acc, log) => acc + ((log.rpe_score || 0) * (log.session_duration || 0)), 0);
    
    const acuteLoad = calculateWorkload(logs.slice(0, 7)) / 7;
    const chronicLoad = calculateWorkload(logs) / logs.length;
    
    acwrRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

    if (acwrRatio > 1.5) {
        statusMessage = "Riesgo de Lesión Alto";
        statusColor = "bg-rose-600 text-white border-rose-400";
    } else if (acwrRatio >= 0.8 && acwrRatio <= 1.3) {
        statusMessage = "Zona Óptima (Sweet Spot)";
        statusColor = "bg-emerald-50 text-emerald-900 border-emerald-200";
    } else {
        statusMessage = "Carga en Progresión";
    }
  }

  const { data: dailyLog } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).single()
  const { data: history } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(7)

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <Header userName={profile?.first_name || 'Atleta'} userImage={profile?.avatar_url} userId={user.id} />

      <div className="px-6 -mt-8 relative z-20 space-y-6">
        
        {/* WIDGET ACWR */}
        <div className={`p-5 rounded-[32px] shadow-xl flex items-center justify-between border transition-all ${statusColor}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${acwrRatio > 1.5 ? 'bg-rose-500/20' : 'bg-white/50'}`}>
              {acwrRatio > 1.5 ? <AlertTriangle className="h-6 w-6 text-white" /> : <ShieldCheck className="h-6 w-6 text-teal-600" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                Ratio ACWR <Info className="h-3 w-3" />
              </p>
              <h4 className="font-black text-xl">{acwrRatio > 0 ? acwrRatio.toFixed(2) : "--"}</h4>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-60">Estado de Carga</p>
            <p className="text-xs font-black">{statusMessage}</p>
          </div>
        </div>

        {dailyLog?.suggested_routine ? (
            <RecommendationCard dailyLog={dailyLog} userId={user.id} />
        ) : (
            <div className="bg-white rounded-[32px] p-10 text-center shadow-xl border border-stone-100">
                <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">😴</div>
                <h3 className="text-xl font-bold text-stone-800">Sin registros hoy</h3>
                <p className="text-stone-500 text-sm mt-2">Completa tu reporte para recibir tu rutina.</p>
                <div className="flex flex-col items-center justify-center gap-2 text-teal-600 animate-bounce mt-8">
                    <ArrowDown className="h-6 w-6" />
                </div>
            </div>
        )}

        <div className="pt-4 border-t border-stone-200">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">Tu Evolución</h3>
            <TrendChart data={history || []} />
        </div>
      </div>
    </div>
  )
}