'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, Bell, Sun, CloudRain, Cloud, Camera, Loader2, Download, X, Droplets } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'

interface Props {
  userName: string
  userImage?: string | null
  userId: string
}

function WeatherIcon({ code }: { code: number }) {
  if (code >= 61) return <CloudRain className="h-4 w-4 text-blue-300" />
  if (code >= 2) return <Cloud className="h-4 w-4 text-stone-300" />
  return <Sun className="h-4 w-4 text-amber-300" />
}

export default function Header({ userName, userImage, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [showNotifs, setShowNotifs] = useState(false)
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userImage ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`)
        const json = await res.json()
        setWeather({ temp: json.current_weather.temperature, code: json.current_weather.weathercode })
      } catch { /* clima no crítico */ }
    })
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setUploadError('Solo se permiten imágenes.')
    if (file.size > 5 * 1024 * 1024) return setUploadError('Máximo 5MB.')

    setUploading(true)
    setUploadError(null)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${userId}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      if (dbErr) throw dbErr
      setAvatarUrl(publicUrl)
      router.refresh()
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir la foto.')
    } finally {
      setUploading(false)
    }
  }, [userId, supabase, router])

  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportError(null)
    try {
      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('log_date, sleep_hours, stress_level, fatigue_level, soreness_level, rpe_score, session_duration, notes')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })

      if (error) throw new Error(error.message)
      if (!logs?.length) throw new Error('No hay datos para exportar.')

      const headers = ['Fecha','Horas_Sueno','Nivel_Estres','Nivel_Fatiga','Dolor_Muscular','RPE_Esfuerzo','Duracion_Min','Carga_Sesion_sRPE','Notas']
      const rows = logs.map(log => {
        const carga = (log.rpe_score ?? 0) * (log.session_duration ?? 0)
        const notes = (log.notes ?? '').replace(/"/g, '""')
        return [log.log_date, log.sleep_hours ?? '', log.stress_level ?? '', log.fatigue_level ?? '', log.soreness_level ?? '', log.rpe_score ?? '', log.session_duration ?? '', carga, `"${notes}"`].join(',')
      })

      const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BioBalance_Tesis_${userName}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setExportError(err.message || 'Error al exportar.')
    } finally {
      setExporting(false)
    }
  }, [userId, userName, supabase])

  return (
    <header className="bg-teal-700 pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg relative z-50">
      {/* Clima */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-teal-800/50 px-3 py-1 rounded-full backdrop-blur-sm border border-teal-600">
        <WeatherIcon code={weather?.code ?? 0} />
        <span className="text-xs font-bold text-teal-100">{weather ? `${Math.round(weather.temp)}°C` : '--°C'}</span>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          <div className="relative group h-14 w-14">
            <div className="h-14 w-14 rounded-2xl border-2 border-teal-500/50 overflow-hidden bg-teal-800 flex items-center justify-center relative shadow-md">
              {avatarUrl ? <Image src={avatarUrl} alt="Perfil" fill className="object-cover" /> : <span className="text-xl font-bold text-teal-100">{userName.charAt(0).toUpperCase()}</span>}
              {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-5 w-5 text-white animate-spin" /></div>}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl" title="Cambiar foto">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="text-teal-200 text-xs font-medium">Hola, Atleta</p>
            <h1 className="text-xl font-bold text-white tracking-tight">{userName.split(' ')[0]}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={exporting} size="icon" className="rounded-full h-10 w-10 bg-teal-600/50 text-white hover:bg-emerald-500 shadow-inner border border-teal-500/30">
            {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          </Button>
          <Button onClick={() => setShowNotifs(v => !v)} size="icon" className={`rounded-full h-10 w-10 ${showNotifs ? 'bg-white text-teal-700' : 'bg-teal-600/50 text-white'}`}>
            <Bell className="h-5 w-5" />
          </Button>
          <Button onClick={handleLogout} size="icon" variant="ghost" className="text-teal-100 rounded-full hover:bg-teal-600/50">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mensajes de error */}
      {(uploadError || exportError) && (
        <div className="mt-3 flex items-center justify-between text-xs text-rose-200 bg-rose-800/40 border border-rose-600/40 rounded-xl px-3 py-2">
          <span>{uploadError || exportError}</span>
          <button onClick={() => {setUploadError(null); setExportError(null)}}><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Panel Notificaciones */}
      {showNotifs && (
        <div className="absolute top-20 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-stone-800">Avisos de Tesis</p>
            <X onClick={() => setShowNotifs(false)} className="h-4 w-4 cursor-pointer text-stone-400" />
          </div>
          <div className="flex gap-3 items-start p-2 hover:bg-stone-50 rounded-lg">
            <div className="bg-blue-50 p-2 rounded-full"><Droplets className="h-4 w-4 text-blue-500"/></div>
            <div><p className="text-xs font-bold text-stone-800">Exportación Lista</p><p className="text-[10px] text-stone-500">Usa el botón de descarga para tus datos.</p></div>
          </div>
        </div>
      )}
    </header>
  )
}