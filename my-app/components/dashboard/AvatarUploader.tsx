'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string;
  currentAvatarUrl?: string | null;
}

export default function AvatarUploader({ userId, currentAvatarUrl }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Selecciona una imagen.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Date.now()}.${fileExt}`

      // 1. Subir a Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Guardar URL en el Perfil del Usuario
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setPreview(publicUrl)
      router.refresh() // Recargar para que el Header se actualice
      
    } catch (error) {
      console.error(error)
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group h-24 w-24 mx-auto">
        <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative bg-stone-200">
            {preview ? (
                <Image src={preview} alt="Avatar" fill className="object-cover" />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-stone-400">
                    <User className="h-10 w-10" />
                </div>
            )}
        </div>
        
        {/* Input invisible sobre la imagen */}
        <label className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl backdrop-blur-sm">
            {uploading ? <Loader2 className="animate-spin h-6 w-6" /> : <Camera className="h-6 w-6" />}
            <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
            />
        </label>
    </div>
  )
}