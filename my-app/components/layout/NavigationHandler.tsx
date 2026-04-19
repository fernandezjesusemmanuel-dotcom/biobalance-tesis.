'use client'

import { usePathname } from 'next/navigation'
import AIChat from "@/components/dashboard/AIChat"; 
import BottomNav from "@/components/dashboard/BottomNav"; 

export default function NavigationHandler() {
  const pathname = usePathname()

  // Definimos las rutas donde la barra de navegación NO debe aparecer
  // Esto reduce la carga cognitiva durante el acceso [cite: 12, 68]
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/pre-ingreso" ||
    pathname.startsWith("/auth");

  if (isAuthPage) return null

  return (
    <>
      <AIChat />
      <BottomNav />
    </>
  )
}