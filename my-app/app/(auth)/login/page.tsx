'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signIn } from '@/app/login/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Iniciando sesión...' : 'Ingresar'}
    </Button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [state, formAction] = useActionState(signIn, null)

  const redirectedFrom = searchParams.get('redirectedFrom') ?? '/'

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <Card className="w-full max-w-md rounded-3xl border-stone-200 shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-teal-900">Iniciar sesión</CardTitle>
          <CardDescription>
            Accede a BioBalance con tu correo institucional y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" action={formAction}>
            <input type="hidden" name="redirectedFrom" value={redirectedFrom} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="email">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@institucion.edu"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {state?.error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : null}

            <SubmitButton />
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿No tienes cuenta?{' '}
            <Link className="font-semibold text-teal-700 hover:text-teal-800" href="/registro">
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
