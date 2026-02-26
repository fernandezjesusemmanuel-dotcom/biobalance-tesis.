import { createClient }   from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import { ArrowDown, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react'
import Header              from '@/components/dashboard/Header'
import RecommendationCard  from '@/components/dashboard/RecommendationCard'
import TrendChart          from '@/components/dashboard/TrendChart'

export const dynamic = 'force-dynamic'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LÓGICA ACWR — funciones puras fuera del componente
// Testeables de forma aislada, sin dependencias de React
//
// Referencias:
//   Gabbett, T.J. (2016). British Journal of Sports Medicine, 50(5), 273-280.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface LogEntry { rpe_score: number | null; session_duration: number | null; log_date: string }

type ACWRZone = 'insufficient_data' | 'high_risk' | 'optimal' | 'progressing'

interface ACWRResult {
  ratio:         number
  zone:          ACWRZone
  acuteLoad:     number
  chronicLoad:   number
  statusMessage: string
}

function avgLoad(logs: LogEntry[]): number {
  if (!logs.length) return 0
  return logs.reduce((acc, l) => acc + (l.rpe_score ?? 0) * (l.session_duration ?? 0), 0) / logs.length
}

function calculateACWR(logs: LogEntry[]): ACWRResult {
  if (!logs || logs.length < 7) {
    return { ratio: 0, zone: 'insufficient_data', acuteLoad: 0, chronicLoad: 0, statusMessage: 'Recolectando datos...' }
  }
  const acuteLoad   = avgLoad(logs.slice(0, 7))
  const chronicLoad = avgLoad(logs)
  const ratio       = chronicLoad > 0 ? acuteLoad / chronicLoad : 0

  if (ratio > 1.5)                    return { ratio, zone: 'high_risk',   acuteLoad, chronicLoad, statusMessage: 'Riesgo de Lesión Alto'      }
  if (ratio >= 0.8 && ratio <= 1.3)   return { ratio, zone: 'optimal',     acuteLoad, chronicLoad, statusMessage: 'Zona Óptima (Sweet Spot)'   }
  return                                     { ratio, zone: 'progressing', acuteLoad, chronicLoad, statusMessage: 'Carga en Progresión'         }
}

// ── Estilos Tailwind por zona (separados de la lógica) ──────
function acwrStyles(zone: ACWRZone) {
  if (zone === 'high_risk') return { card: 'bg-rose-600 text-white border-rose-400',         iconBg: 'bg-rose-500/20'  }
  if (zone === 'optimal')   return { card: 'bg-emerald-50 text-emerald-900 border-emerald-200', iconBg: 'bg-white/50'  }
  return                           { card: 'bg-white text-stone-800 border-stone-100',        iconBg: 'bg-stone-100'   }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVER COMPONENT — solo fetch + composición
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default async function Dashboard() {
  const supabase = await createClient()

  // ── Autenticación y guards ───────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, age, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile?.first_name || !profile?.age) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]

  // ── Fetch paralelo: evita 3 waterfalls secuenciales ─────
  // Promise.all reduce latencia de ~900ms → ~300ms en producción
  const [
    { data: acwrLogs },
    { data: dailyLog },
    { data: history  },
  ] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('log_date, rpe_score, session_duration')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(28),

    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle(), // maybeSingle > single: no lanza error si no existe el registro

    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(7),
  ])

  // ── Cálculo ACWR en servidor (función pura, sin estado) ──
  const acwr    = calculateACWR(acwrLogs ?? [])
  const styles  = acwrStyles(acwr.zone)
  const hasData = acwr.zone !== 'insufficient_data'

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <Header
        userName={profile.first_name}
        userImage={profile.avatar_url}
        userId={user.id}
      />

      <div className="px-6 -mt-8 relative z-20 space-y-6">

        {/* ── Widget ACWR ── */}
        <div className={`p-5 rounded-[32px] shadow-xl flex items-center justify-between border transition-all ${styles.card}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${styles.iconBg}`}>
              {acwr.zone === 'high_risk'
                ? <AlertTriangle className="h-6 w-6 text-white"    />
                : hasData
                  ? <ShieldCheck className="h-6 w-6 text-teal-600" />
                  : <TrendingUp  className="h-6 w-6 text-stone-400"/>
              }
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                Ratio ACWR
                <span title="Acute:Chronic Workload Ratio (Gabbett, 2016). Zona óptima: 0.8–1.3">
                  <Info className="h-3 w-3 cursor-help" />
                </span>
              </p>
              <h4 className="font-black text-xl">
                {hasData ? acwr.ratio.toFixed(2) : '--'}
              </h4>
              {hasData && (
                <p className="text-[10px] opacity-50 mt-0.5">
                  Aguda {acwr.acuteLoad.toFixed(0)} · Crónica {acwr.chronicLoad.toFixed(0)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-60">Estado de Carga</p>
            <p className="text-xs font-black">{acwr.statusMessage}</p>
          </div>
        </div>

        {/* ── Rutina del día o CTA vacío ── */}
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

        {/* ── Gráfico de evolución ── */}
        <div className="pt-4 border-t border-stone-200">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">Tu Evolución</h3>
          <TrendChart data={history ?? []} />
        </div>
      </div>
    </div>
  )
}