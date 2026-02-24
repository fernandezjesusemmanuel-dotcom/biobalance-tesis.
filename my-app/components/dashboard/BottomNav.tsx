'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Dumbbell, History } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  // Ocultar barra en login
  if (pathname === '/login') return null

  const isActive = (path: string) => pathname === path

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50">
      <div className="bg-stone-900/95 backdrop-blur-md text-stone-400 p-2 rounded-3xl shadow-2xl flex justify-between items-center px-6 border border-white/10">
        
        <Link href="/">
          <div className={`p-3 rounded-xl transition-all ${isActive('/') ? 'bg-teal-500/20 text-teal-400' : 'hover:text-white'}`}>
            <Home className="h-6 w-6" />
          </div>
        </Link>

        {/* BOTÓN MÁS GRANDE Y DESTACADO QUE LLEVA AL CHECK-IN */}
        <Link href="/checkin">
            <div className="bg-teal-500 hover:bg-teal-400 text-stone-900 p-4 rounded-2xl shadow-lg shadow-teal-500/20 -mt-8 border-4 border-stone-50 transition-transform hover:scale-105 active:scale-95">
                <Plus className="h-8 w-8" strokeWidth={3} />
            </div>
        </Link>

        {/* Este lleva al último workout o lista de ejercicios */}
        <Link href="/workout">
          <div className={`p-3 rounded-xl transition-all ${isActive('/workout') ? 'bg-teal-500/20 text-teal-400' : 'hover:text-white'}`}>
            <Dumbbell className="h-6 w-6" />
          </div>
        </Link>

        <Link href="/history">
            <div className={`p-3 rounded-xl transition-all ${isActive('/history') ? 'bg-teal-500/20 text-teal-400' : 'hover:text-white'}`}>
                <History className="h-6 w-6" />
            </div>
        </Link>

      </div>
    </div>
  )
}