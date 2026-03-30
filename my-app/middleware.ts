import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Crear una respuesta básica para manejar cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si faltan las llaves en el .env, no bloqueamos para poder depurar
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  // 2. Cliente de Supabase especializado para Middleware (SSR)
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Actualizamos la request y la respuesta simultáneamente
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Verificación de identidad
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isRegisterPage = request.nextUrl.pathname.startsWith('/register')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  // LÓGICA DE PROTECCIÓN:
  // Si no hay usuario y no está en login/register/auth -> Mandar a Login
  if (!user && !isLoginPage && !isRegisterPage && !isAuthCallback) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya hay usuario e intenta ir al login -> Mandarlo al Dashboard (Home)
  if (user && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

// CONFIGURACIÓN DEL MATCHER:
// Excluimos archivos estáticos, api y el favicon para no ralentizar el sistema
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}