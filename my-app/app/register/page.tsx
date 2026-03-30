'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, Mail, Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Guardamos el nombre en los metadatos para que el Trigger de SQL lo tome
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("Error crítico en el registro")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white rounded-[32px] overflow-hidden text-center p-8 space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-teal-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-800">¡Casi listo!</h2>
            <p className="text-stone-500 text-sm font-medium">
              Hemos enviado un enlace de confirmación a <strong>{email}</strong>. 
              Por favor, verifica tu correo para activar tu perfil de BioBalance.
            </p>
          </div>
          <Button onClick={() => router.push('/login')} className="w-full bg-stone-900 text-white rounded-xl h-12 font-bold">
            VOLVER AL LOGIN
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-stone-100 bg-white rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center space-y-3 pt-10 pb-2">
          <Link href="/login" className="absolute left-6 top-10 text-stone-400 hover:text-teal-600 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-teal-900 tracking-tight">Crear Cuenta</CardTitle>
            <CardDescription className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">
              Únete al Programa BioBalance 2026
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-10 px-8 pt-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nombre Completo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                <Input 
                  type="text" 
                  placeholder="Juan Pérez" 
                  className="pl-10 h-12 bg-stone-50 border-stone-200 focus:ring-teal-500 rounded-xl font-medium" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Email Institucional</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                <Input 
                  type="email" 
                  placeholder="alumno@facultad.edu.ar" 
                  className="pl-10 h-12 bg-stone-50 border-stone-200 focus:ring-teal-500 rounded-xl font-medium" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Contraseña (mín. 6 caracteres)</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 bg-stone-50 border-stone-200 focus:ring-teal-500 rounded-xl" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/10 mt-4 transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> PROCESANDO ALTA...</>
              ) : (
                "REGISTRARME EN EL ESTUDIO"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-stone-400 text-[10px] font-medium leading-relaxed px-4">
            Al registrarte, aceptas participar en el protocolo de gestión de carga alostática BioBalance 2026.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}