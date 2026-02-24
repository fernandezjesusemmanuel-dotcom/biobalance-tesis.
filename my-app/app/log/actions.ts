'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveLog(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verificamos usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Obtenemos datos del formulario
  const sleep_hours = parseFloat(formData.get('sleep') as string)
  const stress_level = parseInt(formData.get('stress') as string)
  const notes = formData.get('notes') as string
  const date = new Date().toISOString().split('T')[0] 

  // 3. Guardamos en Supabase
  const { error } = await supabase
    .from('daily_logs')
    .upsert({ 
        user_id: user.id,
        log_date: date,
        sleep_hours,
        stress_level,
        notes
    }, { onConflict: 'user_id, log_date' })

  if (error) {
    console.error('Error guardando:', error)
    // NO devolvemos nada aquí para evitar el error de TypeScript
    return 
  }

  // 4. Volvemos al inicio (Solo si no hubo error)
  revalidatePath('/')
  redirect('/')
}