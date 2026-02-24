'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, User, Briefcase, Users, Calendar } from 'lucide-react'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    age: '',
    gender: '',
    employment_status: '',
    caregiver_status: ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Obtenemos el ID del usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Guardamos o actualizamos el perfil en Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.first_name,
          age: parseInt(formData.age),
          gender: formData.gender,
          employment_status: formData.employment_status,
          caregiver_status: formData.caregiver_status,
          updated_at: new Date()
        })

      if (!error) {
        // Si todo sale bien, refrescamos y vamos al Dashboard
        router.push('/')
        router.refresh()
      } else {
        alert("Error al guardar el perfil: " + error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border-none animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="pt-10">
          <CardTitle className="text-2xl font-bold text-teal-900 text-center">Configura tu Perfil</CardTitle>
          <p className="text-center text-stone-500 text-sm">
            Necesitamos estos datos para contextualizar tu carga de entrenamiento en la tesis.
          </p>
        </CardHeader>
        <CardContent className="pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* NOMBRE */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <User className="h-3 w-3" /> Nombre de pila
              </label>
              <Input 
                placeholder="Tu nombre" 
                className="rounded-xl h-12 bg-stone-50 border-stone-200 focus:ring-teal-500" 
                value={formData.first_name} 
                onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* EDAD */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Edad
                </label>
                <Input 
                  type="number" 
                  placeholder="Ej: 28" 
                  className="rounded-xl h-12 bg-stone-50 border-stone-200" 
                  value={formData.age} 
                  onChange={(e) => setFormData({...formData, age: e.target.value})} 
                  required 
                />
              </div>
              {/* GÉNERO */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                   Género
                </label>
                <select 
                  className="w-full h-12 rounded-xl bg-stone-50 border border-stone-200 px-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                  value={formData.gender} 
                  onChange={(e) => setFormData({...formData, gender: e.target.value})} 
                  required
                >
                  <option value="">Selecciona...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* SITUACIÓN LABORAL */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-3 w-3" /> Situación Laboral
              </label>
              <select 
                className="w-full h-12 rounded-xl bg-stone-50 border border-stone-200 px-3 text-sm outline-none" 
                value={formData.employment_status} 
                onChange={(e) => setFormData({...formData, employment_status: e.target.value})} 
                required
              >
                <option value="">Selecciona tu ocupación...</option>
                <option value="Empleado">Empleado (Relación de dependencia)</option>
                <option value="Autónomo">Autónomo / Independiente</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Desempleado">Buscando empleo / Desempleado</option>
                <option value="Hogar">Tareas del Hogar</option>
              </select>
            </div>

            {/* PERSONAS A CARGO */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="h-3 w-3" /> Personas a cargo (Cuidados)
              </label>
              <select 
                className="w-full h-12 rounded-xl bg-stone-50 border border-stone-200 px-3 text-sm outline-none" 
                value={formData.caregiver_status} 
                onChange={(e) => setFormData({...formData, caregiver_status: e.target.value})} 
                required
              >
                <option value="">¿Tienes personas a cargo?</option>
                <option value="Ninguna">No tengo personas a cargo</option>
                <option value="Hijos">Hijos menores</option>
                <option value="Adultos Mayores">Adultos Mayores</option>
                <option value="Discapacidad">Personas con discapacidad</option>
                <option value="Multiple">Varios de los anteriores</option>
              </select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-lg shadow-teal-900/20 transition-all" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Finalizar y Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}