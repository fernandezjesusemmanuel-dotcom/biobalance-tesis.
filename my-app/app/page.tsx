import { createClient }  from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import { AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react'
import Header             from '@/components/dashboard/Header'
import RecommendationCard from '@/components/dashboard/RecommendationCard'
import TrendChart         from '@/components/dashboard/TrendChart'
import Link               from 'next/link'
import { asSuggestedRoutine } from '@/types/routine'
import {
  daysUntilDate,
  formatAcademicPhaseLabel,
  getAcademicLoadPhase,
  isExamWeek,
} from '@/lib/allostasis/academic-load'
import { GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── LÓGICA ACWR (Gabbett, 2016) — funciones puras ───────────
interface LogEntry { rpe_score: number | null; session_duration: number | null; log_date: string }
type ACWRZone = 'insufficient_data' | 'high_risk' | 'optimal' | 'progressing'
interface ACWRResult { ratio: number; zone: ACWRZone; acuteLoad: number; chronicLoad: number; statusMessage: string }

function avgLoad(logs: LogEntry[]): number {
  if (!logs.length) return 0
  return logs.reduce((acc, l) => acc + (l.rpe_score ?? 0) * (l.session_duration ?? 0), 0) / logs.length
}

function calculateACWR(logs: LogEntry[]): ACWRResult {
  if (!logs || logs.length < 7)
    return { ratio: 0, zone: 'insufficient_data', acuteLoad: 0, chronicLoad: 0, statusMessage: 'Recolectando datos...' }
  const acuteLoad   = avgLoad(logs.slice(0, 7))
  const chronicLoad = avgLoad(logs)
  const ratio       = chronicLoad > 0 ? acuteLoad / chronicLoad : 0
  if (ratio > 1.5)                  return { ratio, zone: 'high_risk',   acuteLoad, chronicLoad, statusMessage: 'Riesgo de Lesión Alto' }
  if (ratio >= 0.8 && ratio <= 1.3) return { ratio, zone: 'optimal',     acuteLoad, chronicLoad, statusMessage: 'Zona Óptima'           }
  return                                   { ratio, zone: 'progressing', acuteLoad, chronicLoad, statusMessage: 'Carga en Progresión'   }
}

function acwrStyles(zone: ACWRZone) {
  if (zone === 'high_risk') return { card: 'bg-rose-600 text-white border-rose-400',            iconBg: 'bg-rose-500/20', iconColor: 'text-white'      }
  if (zone === 'optimal')   return { card: 'bg-emerald-50 text-emerald-900 border-emerald-200', iconBg: 'bg-white/50',    iconColor: 'text-emerald-600' }
  return                           { card: 'bg-white text-stone-800 border-stone-100',          iconBg: 'bg-stone-100',   iconColor: 'text-stone-400'   }
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('first_name, avatar_url, age').eq('id', user.id).single()
  if (!profile?.first_name) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: acwrLogs }, { data: dailyLog }, { data: history }, { data: academicEvents }] =
    await Promise.all([
    supabase.from('daily_logs').select('log_date, rpe_score, session_duration').eq('user_id', user.id).order('log_date', { ascending: false }).limit(28),
    supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
    supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(7),
    supabase
      .from('academic_events')
      .select('title, event_type, event_date')
      .eq('user_id', user.id)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(5),
  ])

  const acwr   = calculateACWR(acwrLogs ?? [])
  const styles = acwrStyles(acwr.zone)
  const hasData = acwr.zone !== 'insufficient_data'

  // ── ¿Ya hizo check-in hoy? ───────────────────────────────
  // Determina el CTA del estado vacío
  const hasCheckedIn = !!dailyLog

  const nearestAcademic = academicEvents?.[0]
    ? {
        title: academicEvents[0].title,
        eventType: academicEvents[0].event_type as 'exam' | 'delivery',
        daysUntil: daysUntilDate(academicEvents[0].event_date),
      }
    : null
  const academicPhase = nearestAcademic
    ? getAcademicLoadPhase(nearestAcademic.daysUntil)
    : 'none'

  return (
    <div className="clinical-page min-h-screen">
      <Header userName={profile.first_name} userImage={profile.avatar_url} userId={user.id} />

      <div className="px-6 -mt-8 relative z-20 space-y-6 pb-32">

        {/* ── Widget ACWR ── */}
        <div className={`p-5 rounded-[32px] shadow-xl flex items-center justify-between border ${styles.card}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${styles.iconBg}`}>
              {acwr.zone === 'high_risk'
                ? <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
                : hasData
                  ? <ShieldCheck  className={`h-6 w-6 ${styles.iconColor}`} />
                  : <TrendingUp   className={`h-6 w-6 ${styles.iconColor}`} />
              }
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                Ratio ACWR
                <span title="Acute:Chronic Workload Ratio (Gabbett, 2016). Zona óptima: 0.8–1.3">
                  <Info className="h-3 w-3 cursor-help" />
                </span>
              </p>
              <h4 className="font-black text-xl">{hasData ? acwr.ratio.toFixed(2) : '--'}</h4>
              {/* Cargas visibles para el usuario — útil para la tesis */}
              {hasData && (
                <p className="text-[10px] opacity-50 mt-0.5">
                  Aguda {acwr.acuteLoad.toFixed(0)} · Crónica {acwr.chronicLoad.toFixed(0)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-60">Estado</p>
            <p className="text-xs font-black">{acwr.statusMessage}</p>
          </div>
        </div>

        {nearestAcademic && isExamWeek(nearestAcademic.daysUntil) && (
          <div className="clinical-alert">
            <GraduationCap className="h-5 w-5 shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                {formatAcademicPhaseLabel(academicPhase)} — {nearestAcademic.title}
              </p>
              <p className="mt-1 text-xs text-amber-800/90">
                BioBalance reducirá la carga física y sugerirá Yoga Nidra / respiración durante los
                próximos {nearestAcademic.daysUntil} día(s).
              </p>
            </div>
            <Link
              href="/academic"
              className="shrink-0 rounded-xl bg-amber-700 px-3 py-2 text-[10px] font-bold uppercase text-white"
            >
              Ver calendario
            </Link>
          </div>
        )}

        {/* ── Rutina del día o CTA contextual ── */}
        {dailyLog?.suggested_routine ? (
          <RecommendationCard dailyLog={{ suggested_routine: asSuggestedRoutine(dailyLog.suggested_routine) }} />
        ) : (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-xl border border-stone-100">
            <div className="h-20 w-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              {hasCheckedIn ? '⏳' : '😴'}
            </div>
            <h3 className="text-xl font-bold text-stone-800">
              {hasCheckedIn ? 'Procesando tu rutina' : 'Registra tu día'}
            </h3>
            <p className="text-stone-500 text-sm mt-2">
              {hasCheckedIn
                ? 'La IA está generando tu plan. Recarga en unos segundos.'
                : 'Necesitamos tus datos para el diagnóstico.'
              }
            </p>
            {/* CTA directo al log si aún no hizo check-in */}
            {!hasCheckedIn && (
              <Link href="/log">
                <button className="mt-6 bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-teal-700 transition-colors">
                  Completar Check-in
                </button>
              </Link>
            )}
          </div>
        )}

        <TrendChart data={history ?? []} />
      </div>
    </div>
  )
}