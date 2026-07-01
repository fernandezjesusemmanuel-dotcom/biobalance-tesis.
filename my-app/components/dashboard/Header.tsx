'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter }   from 'next/navigation'
import Image           from 'next/image'
import { LogOut, Loader2, Download } from 'lucide-react'
import { Button }      from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'
import { downloadThesisCsv, fetchThesisExportRows } from '@/lib/thesis/export-csv'

interface Props {
  userName:  string
  userImage?: string | null
  userId:    string
}

export default function Header({ userName, userImage, userId }: Props) {
  const router = useRouter()

  // ✅ FIX 1: createClient fuera del render cycle con useMemo
  // Sin esto se crea una nueva instancia de Supabase en cada re-render
  const supabase = useMemo(() => createClient(), [])

  const [weather,     setWeather]     = useState<{ temp: number; code: number } | null>(null)
  const [exporting,   setExporting]   = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`)
        const json = await res.json()
        setWeather({ temp: json.current_weather.temperature, code: json.current_weather.weathercode })
      } catch { /* clima decorativo, fallo silencioso */ }
    })
  }, [])

  // ✅ FIX 2: try/catch completo — sin esto exporting queda true para siempre si Supabase falla
  // ✅ FIX 3: revokeObjectURL libera la URL del blob de memoria después del click
  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportError(null)
    try {
      const rows = await fetchThesisExportRows(supabase, userId)
      downloadThesisCsv(rows)
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Error al exportar.')
    } finally {
      setExporting(false)
    }
  }, [supabase, userId])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [supabase, router])

  return (
    <header className="bg-teal-700 pt-10 pb-12 px-6 rounded-b-[40px] shadow-lg relative z-30">
      <div className="flex justify-between items-center">

        {/* Avatar + nombre + clima */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <div className="h-12 w-12 rounded-xl bg-teal-800 border border-teal-500/30 overflow-hidden relative">
              {userImage
                ? <Image src={userImage} alt="Perfil" fill className="object-cover" />
                : <div className="flex items-center justify-center h-full text-white font-bold">{userName[0]}</div>
              }
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">{userName.split(' ')[0]}</h1>
            <p className="text-teal-200 text-[10px] mt-1">
              {weather ? `${Math.round(weather.temp)}°C` : '--°C'} • Mendoza
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="icon"
            variant="ghost"
            className="bg-white/10 text-white rounded-full"
            title="Exportar datos para tesis"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleLogout}
            size="icon"
            variant="ghost"
            className="text-white/70 hover:text-white"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error de exportación inline — no bloquea la UI */}
      {exportError && (
        <p className="text-[10px] text-rose-300 mt-2 text-right">{exportError}</p>
      )}
    </header>
  )
}