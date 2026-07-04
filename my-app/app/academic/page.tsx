import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AcademicLoadManager from '@/components/academic/AcademicLoadManager'

export default async function AcademicPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  if (!profile?.first_name) redirect('/onboarding')

  const { data: academicEvents } = await supabase
    .from('academic_events')
    .select('id, title, event_type, event_date, notes')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  return (
    <div className="clinical-page min-h-screen pb-28">
      <div className="clinical-page-header">
        <Link href="/">
          <Button variant="ghost" size="icon" className="-ml-2 text-slate-500">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="clinical-title text-2xl">Gestión Académica</h1>
          <p className="clinical-subtitle">
            Variables moderadoras de carga cognitiva para el algoritmo de alostasis.
          </p>
        </div>
      </div>

      <div className="px-6">
        <AcademicLoadManager userId={user.id} initialEvents={academicEvents ?? []} />
      </div>
    </div>
  )
}
