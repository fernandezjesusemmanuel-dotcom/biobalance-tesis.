import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DASHBOARD_PREFIXES = ['/history', '/log', '/checkin', '/workout', '/pre-ingreso', '/academic', '/onboarding']
const AUTH_PREFIXES = ['/login', '/registro', '/register', '/auth']
const PUBLIC_PATHS = ['/login', '/register', '/registro', '/auth', '/']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Regla 1 — early return: rutas públicas no entran a guardias de protección
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  // Regla 3 — cookies con getAll/setAll
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const matchesPath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)

  const isAuthPath = AUTH_PREFIXES.some(matchesPath)
  const isProtected = DASHBOARD_PREFIXES.some(matchesPath)

  // Regla 2 — guardia de rutas protegidas; redirectedFrom nunca es ruta auth
  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    if (!isAuthPath) {
      loginUrl.searchParams.set('redirectedFrom', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
