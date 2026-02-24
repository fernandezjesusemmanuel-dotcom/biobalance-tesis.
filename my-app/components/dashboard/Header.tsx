'use client'

import { useState, useEffect } from 'react'
import { LogOut, Bell, Sun, CloudRain, Cloud, Droplets, X, Camera, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image' 

interface Props {
  userName: string;
  userImage?: string | null;
  userId: string;
}

export default function Header({ userName, userImage, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  // ESTADOS
  const [showNotifs, setShowNotifs] = useState(false)
  const [weather, setWeather] = useState<{temp: number, code: number} | null>(null)
  
  // Estado para la Foto de Perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userImage || null)
  const [uploading, setUploading] = useState(false)

  // 1. CLIMA REAL (API)
  useEffect(() => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords
            try {
                // Usamos Open-Meteo (Gratis y sin API Key)
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
                const data = await res.json()
                setWeather({
                    temp: data.current_weather.temperature,
                    code: data.current_weather.weathercode
                })
            } catch (e) {
                console.error("Clima no disponible", e)
            }
        })
    }
  }, [])

  // 2. SUBIDA DE FOTO (Lógica Integrada)
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return
      
      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Date.now()}.${fileExt}`

      // A) Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // B) Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // C) Guardar en Base de Datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      // D) Actualizar visualmente al instante
      setAvatarUrl(publicUrl)
      router.refresh()

    } catch (error) {
      alert('Error al actualizar la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  // Icono dinámico del clima
  const getWeatherIcon = () => {
      if (!weather) return <Sun className="h-4 w-4 text-amber-100" />
      if (weather.code >= 51) return <CloudRain className="h-4 w-4 text-blue-200" /> 
      if (weather.code >= 3) return <Cloud className="h-4 w-4 text-stone-300" /> 
      return <Sun className="h-4 w-4 text-amber-300" /> 
  }

  return (
    <header className="bg-teal-700 pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-visible z-50">
      
      {/* WIDGET CLIMA (Flotante Derecha) */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-teal-800/50 px-3 py-1 rounded-full backdrop-blur-sm border border-teal-600">
          {getWeatherIcon()}
          <span className="text-xs font-bold text-teal-100">
              {weather ? `${Math.round(weather.temp)}°C` : '--°C'}
          </span>
      </div>

      <div className="flex justify-between items-center relative z-10 mt-4">
        
        {/* USUARIO + FOTO INTERACTIVA */}
        <div className="flex items-center gap-4">
            
            {/* CÍRCULO DE FOTO (Ahora es un input escondido) */}
            <div className="relative group h-14 w-14">
                <div className="h-14 w-14 rounded-2xl border-2 border-teal-500/50 shadow-md overflow-hidden bg-teal-800 flex items-center justify-center relative">
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt="Perfil" fill className="object-cover" />
                    ) : (
                        <span className="text-xl font-bold text-teal-100">{userName.charAt(0).toUpperCase()}</span>
                    )}
                    
                    {/* Overlay de Carga */}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Input Invisible (Solo aparece el icono de cámara al pasar el mouse) */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl backdrop-blur-sm">
                    <Camera className="h-5 w-5" />
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            <div>
                <p className="text-teal-200 text-xs font-medium mb-0.5">Hola, Atleta</p>
                <h1 className="text-xl font-bold text-white tracking-tight">{userName.split(' ')[0]}</h1>
            </div>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="flex gap-2">
            <div className="relative">
                <Button onClick={() => setShowNotifs(!showNotifs)} size="icon" className={`rounded-full h-10 w-10 transition-colors ${showNotifs ? 'bg-white text-teal-700' : 'bg-teal-600/50 text-white hover:bg-teal-500'}`}>
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-400 rounded-full border border-teal-700 animate-pulse"></span>
                </Button>
                {showNotifs && (
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="flex justify-between mb-2"><span className="text-xs font-bold text-stone-400">AVISOS</span><X onClick={()=>setShowNotifs(false)} className="h-4 w-4 cursor-pointer text-stone-400"/></div>
                        <div className="space-y-2">
                            <div className="flex gap-3 items-start p-2 hover:bg-stone-50 rounded-lg">
                                <div className="bg-blue-50 p-2 rounded-full"><Droplets className="h-4 w-4 text-blue-500"/></div>
                                <div><p className="text-xs font-bold text-stone-800">Hidratación</p><p className="text-[10px] text-stone-500">Recuerda beber agua.</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Button onClick={handleLogout} size="icon" variant="ghost" className="text-teal-100 hover:text-rose-200 rounded-full h-10 w-10"><LogOut className="h-5 w-5" /></Button>
        </div>
      </div>
    </header>
  )
}