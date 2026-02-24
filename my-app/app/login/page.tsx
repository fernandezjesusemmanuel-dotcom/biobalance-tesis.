'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lock, Mail, Loader2, AlertCircle, Activity } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/') 
        router.refresh()
      }
    } catch (err) {
      setError("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-stone-100 bg-white rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-4 pt-12 pb-2">
          <div className="mx-auto h-28 w-28 bg-gradient-to-br from-teal-500 to-emerald-700 rounded-[28px] shadow-2xl shadow-teal-900/20 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-all duration-500">
             <Activity className="h-14 w-14 text-white drop-shadow-md" strokeWidth={2.5} />
          </div>
          <div className="space-y-1 mt-4">
            <CardTitle className="text-3xl font-bold text-teal-900 tracking-tight">BioBalance</CardTitle>
            <CardDescription className="text-stone-500 font-medium">Plataforma de Tesis • Gestión de Carga</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-10 px-8 pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest pl-1">Email Institucional</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                <Input type="email" placeholder="alumno@biobalance.ar" className="pl-10 h-12 bg-stone-50 border-stone-200 focus:ring-teal-500 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-stone-400 tracking-widest pl-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                <Input type="password" placeholder="••••••••" className="pl-10 h-12 bg-stone-50 border-stone-200 focus:ring-teal-500 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error === "Invalid login credentials" ? "Credenciales incorrectas" : error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-lg mt-4" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Ingresar al Sistema"}
            </Button>
          </form>

          {/* BOTÓN DE REGISTRO AÑADIDO */}
          <div className="mt-8 text-center border-t border-stone-100 pt-6">
            <p className="text-stone-500 text-sm">
              ¿No tienes una cuenta?{' '}
              <button onClick={() => router.push('/register')} className="text-teal-700 font-bold hover:underline">
                Regístrate aquí
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}