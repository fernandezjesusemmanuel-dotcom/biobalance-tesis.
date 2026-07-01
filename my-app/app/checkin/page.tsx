import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BalanceCard from '@/components/dashboard/BalanceCard'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default async function CheckInPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="clinical-page min-h-screen p-6 pb-24">
      
      {/* Botón Volver */}
      <div className="mb-6">
        <Link href="/">
            <Button variant="ghost" size="icon" className="-ml-2 text-stone-500">
                <ChevronLeft className="h-6 w-6" />
            </Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <h1 className="clinical-title text-2xl">Nuevo Registro</h1>
        <p className="clinical-subtitle">
          Registra biomarcadores, moderadores y contexto académico para la inferencia activa.
        </p>
      </div>

      {/* Aquí va la tarjeta de carga */}
      <BalanceCard userId={user.id} />
      
    </div>
  )
}