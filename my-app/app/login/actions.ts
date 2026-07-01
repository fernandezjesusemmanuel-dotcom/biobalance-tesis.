'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Recolectamos los datos del formulario
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Intentamos iniciar sesión
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Si falla, podrías redirigir a una página de error o volver al login
    // Por ahora, redirigimos al login con un parámetro de error (opcional)
    redirect('/login?error=true')
  }

  // Si todo sale bien:
  revalidatePath('/', 'layout') // Actualizamos la app
  redirect('/') // Mandamos al usuario al Dashboard
}