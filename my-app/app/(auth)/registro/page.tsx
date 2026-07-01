'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { RolUsuario } from '@/types/database.types'

const ROLES: RolUsuario[] = ['docente', 'alumno']

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<RolUsuario>('alumno')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nombre_completo: nombreCompleto,
          rol,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
        <Card className="w-full max-w-md rounded-3xl border-stone-200 shadow-xl">
          <CardContent className="space-y-4 p-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-stone-900">Registro enviado</h1>
              <p className="text-sm text-stone-600">
                Revisa tu correo para confirmar la cuenta y activar tu acceso a BioBalance.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <Card className="w-full max-w-md rounded-3xl border-stone-200 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-teal-900">Crear cuenta</CardTitle>
          <CardDescription>
            Registra un usuario nuevo y define su rol inicial dentro de la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="nombreCompleto">
                Nombre completo
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <Input
                  id="nombreCompleto"
                  type="text"
                  placeholder="Nombre y apellidos"
                  className="pl-10"
                  value={nombreCompleto}
                  onChange={(event) => setNombreCompleto(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="registroEmail">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <Input
                  id="registroEmail"
                  type="email"
                  placeholder="usuario@institucion.edu"
                  className="pl-10"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="registroPassword">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <Input
                  id="registroPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="rol">
                Rol
              </label>
              <select
                id="rol"
                className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-offset-white transition placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-teal-500"
                value={rol}
                onChange={(event) => setRol(event.target.value as RolUsuario)}
              >
                {ROLES.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Ya tienes cuenta?{' '}
            <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/login">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}