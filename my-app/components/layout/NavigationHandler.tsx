'use client'

import { usePathname } from 'next/navigation'
import AIChat from "../dashboard/AIChat"; 
import BottomNav from "../dashboard/BottomNav"; 

export default function NavigationHandler() {
  const pathname = usePathname()
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/pre-ingreso" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/auth");

  if (isAuthPage) return null

  return (
    <>
      <AIChat />
      <BottomNav />
    </>
  )
}