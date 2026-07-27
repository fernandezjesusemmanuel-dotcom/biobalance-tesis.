'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombreCompleto: z.string().min(1),
  rol: z.enum(['docente', 'alumno']),
})

type SignUpState = { error: string } | { success: string } | null

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const result = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    nombreCompleto: formData.get('nombreCompleto'),
    rol: formData.get('rol'),
  })

  if (!result.success) {
    return { error: 'Datos inválidos.' }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL

  if (!origin) {
    return { error: 'No se pudo determinar la URL del sitio.' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            return
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        nombre_completo: result.data.nombreCompleto,
        rol: result.data.rol,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Revisá tu correo y hacé clic en el link de confirmación.' }
}
