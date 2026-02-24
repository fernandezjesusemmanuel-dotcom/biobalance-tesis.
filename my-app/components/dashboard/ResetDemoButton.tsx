'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function ResetDemoButton() {
  const supabase = createClient()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleReset = async () => {
    if (!confirm('⚠️ MODO DEMO: ¿Estás seguro de borrar TODOS los registros de este usuario?')) return
    
    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay usuario activo")

      // 1. Borrar registros diarios
      await supabase.from('daily_logs').delete().eq('user_id', user.id)
      
      // 2. Borrar sesiones de entrenamiento
      await supabase.from('workout_sessions').delete().eq('user_id', user.id)

      alert('✅ Base de datos limpia. Lista para la demostración.')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Error limpiando la base de datos.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleReset}
      disabled={isDeleting}
      className="fixed bottom-4 right-4 p-3 bg-stone-900/50 hover:bg-rose-600 text-stone-400 hover:text-white rounded-full backdrop-blur-md transition-all z-50 shadow-lg"
      title="Resetear Base de Datos (Demo)"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  )
}