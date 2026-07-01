'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Loader2,
  User,
  Briefcase,
  Users,
  Calendar,
  Moon,
  Dumbbell,
  Shield,
} from 'lucide-react'
import { fitnessLevelLabel } from '@/lib/allostasis/profile-context'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState({
    first_name: '',
    age: '',
    gender: '',
    employment_status: '',
    caregiver_status: '',
    sleep_quality_baseline: [7],
    fitness_level: [5],
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: formData.first_name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        employment_status: formData.employment_status,
        caregiver_status: formData.caregiver_status,
        sleep_quality_baseline: formData.sleep_quality_baseline[0],
        fitness_level: formData.fitness_level[0],
        updated_at: new Date().toISOString(),
      })

      if (!error) {
        router.push('/academic')
        router.refresh()
      } else {
        alert('Error al guardar el perfil: ' + error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="clinical-page flex min-h-screen items-center justify-center p-4">
      <Card className="clinical-card w-full max-w-lg border-none shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-3 pt-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Shield className="h-7 w-7" />
          </div>
          <CardTitle className="clinical-title text-2xl text-teal-900">
            Perfil Clínico BioBalance
          </CardTitle>
          <p className="clinical-subtitle mx-auto max-w-sm">
            Variables moderadoras para personalizar la prescripción de ejercicio adaptativo.
          </p>
          <div className="mx-auto flex gap-2 pt-2">
            <span className={`h-1.5 w-10 rounded-full ${step === 1 ? 'bg-teal-600' : 'bg-teal-200'}`} />
            <span className={`h-1.5 w-10 rounded-full ${step === 2 ? 'bg-teal-600' : 'bg-teal-200'}`} />
          </div>
        </CardHeader>

        <CardContent className="pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="clinical-section space-y-4">
                  <p className="clinical-label">Datos sociodemográficos</p>

                  <div className="space-y-2">
                    <label className="clinical-label flex items-center gap-2">
                      <User className="h-3 w-3" /> Nombre de pila
                    </label>
                    <Input
                      placeholder="Tu nombre"
                      className="clinical-input"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="clinical-label flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Edad
                      </label>
                      <Input
                        type="number"
                        placeholder="Ej: 28"
                        className="clinical-input"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="clinical-label">Género</label>
                      <select
                        className="clinical-select"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        required
                      >
                        <option value="">Selecciona...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="No binario">No binario</option>
                        <option value="Prefiero no decir">Prefiero no decir</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="clinical-label flex items-center gap-2">
                      <Briefcase className="h-3 w-3" /> Situación laboral
                    </label>
                    <select
                      className="clinical-select"
                      value={formData.employment_status}
                      onChange={(e) =>
                        setFormData({ ...formData, employment_status: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecciona tu ocupación...</option>
                      <option value="Empleado">Empleado (dependencia)</option>
                      <option value="Autónomo">Autónomo / Independiente</option>
                      <option value="Estudiante">Estudiante</option>
                      <option value="Desempleado">Buscando empleo</option>
                      <option value="Hogar">Tareas del hogar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="clinical-label flex items-center gap-2">
                      <Users className="h-3 w-3" /> Roles de cuidado familiar
                    </label>
                    <select
                      className="clinical-select"
                      value={formData.caregiver_status}
                      onChange={(e) =>
                        setFormData({ ...formData, caregiver_status: e.target.value })
                      }
                      required
                    >
                      <option value="">¿Tienes personas a cargo?</option>
                      <option value="Ninguna">No tengo personas a cargo</option>
                      <option value="Hijos">Hijos menores</option>
                      <option value="Adultos Mayores">Adultos mayores</option>
                      <option value="Discapacidad">Personas con discapacidad</option>
                      <option value="Multiple">Varios de los anteriores</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  className="clinical-button w-full"
                  onClick={() => setStep(2)}
                  disabled={
                    !formData.first_name ||
                    !formData.age ||
                    !formData.gender ||
                    !formData.employment_status ||
                    !formData.caregiver_status
                  }
                >
                  Continuar — Variables biológicas
                </Button>
              </>
            ) : (
              <>
                <div className="clinical-section space-y-5">
                  <p className="clinical-label">Variables biológicas y de seguridad</p>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-blue-800">
                        <Moon className="h-3.5 w-3.5" /> Calidad de sueño habitual
                      </span>
                      <span className="text-sm font-bold text-blue-900">
                        {formData.sleep_quality_baseline[0]}/10
                      </span>
                    </div>
                    <Slider
                      value={formData.sleep_quality_baseline}
                      onValueChange={(v) =>
                        setFormData({ ...formData, sleep_quality_baseline: v })
                      }
                      max={10}
                      min={1}
                      step={1}
                    />
                    <p className="mt-2 text-[11px] text-blue-700/80">
                      Evalúa la calidad promedio de tu descanso (no solo las horas).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-teal-800">
                        <Dumbbell className="h-3.5 w-3.5" /> Nivel de aptitud física
                      </span>
                      <span className="text-sm font-bold text-teal-900">
                        {formData.fitness_level[0]}/10 ·{' '}
                        {fitnessLevelLabel(formData.fitness_level[0])}
                      </span>
                    </div>
                    <Slider
                      value={formData.fitness_level}
                      onValueChange={(v) => setFormData({ ...formData, fitness_level: v })}
                      max={10}
                      min={1}
                      step={1}
                    />
                    <p className="mt-2 text-[11px] text-teal-700/80">
                      Escala autorreportada para ajustar intensidad y volumen con seguridad clínica.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => setStep(1)}
                  >
                    Atrás
                  </Button>
                  <Button type="submit" className="clinical-button flex-[2]" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...
                      </>
                    ) : (
                      'Finalizar perfil'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
