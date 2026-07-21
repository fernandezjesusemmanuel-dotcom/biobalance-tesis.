'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const result = schema.safeParse({ email, password })
  if (!result.success) {
    return { error: 'Datos inválidos.' }
  }

  // createClient (@/lib/supabase/server) ya usa createServerClient de
  // @supabase/ssr con cookies() + getAll/setAll — cookie sb-* compatible
  // con el middleware. No hace falta duplicar el patrón aquí.
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Debes confirmar tu correo antes de iniciar sesión.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  const redirectTo = (formData.get('redirectedFrom') as string) || '/'
  redirect(redirectTo)
}
