'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Mail, Lock, Loader2, AlertCircle, Activity } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        alert("¡Cuenta creada! Revisa tu email para confirmar o intenta ingresar.")
        router.push('/login')
      }
    } catch (err) {
      setError("Error inesperado al registrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-stone-100 bg-white rounded-[32px] overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-12">
          <div className="mx-auto h-20 w-20 bg-teal-600 rounded-[22px] flex items-center justify-center transform -rotate-3">
             <UserPlus className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-teal-900">Crear Cuenta</CardTitle>
          <CardDescription>Únete a BioBalance para tu seguimiento</CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input type="email" placeholder="Email" className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Contraseña" className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
            
            {error && <div className="text-rose-500 text-xs flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</div>}

            <Button type="submit" className="w-full h-12 bg-teal-700 rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Registrarse"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-stone-500 hover:text-teal-700 font-medium">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}