import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Rutas que requieren sesión activa ────────────────────────
const PROTECTED_PREFIXES = [
  '/history',
  '/log',
  '/checkin',
  '/workout',
  '/pre-ingreso',
  '/academic',
]

// ── Rutas solo para usuarios NO autenticados ─────────────────
const AUTH_ONLY_PATHS = ['/login', '/registro', '/register']

export async function middleware(request: NextRequest) {
  // ✅ FIX 1: response se inicializa UNA sola vez aquí.
  // Los handlers de cookies NO deben recrearlo — solo mutar
  // las cookies sobre este mismo objeto para evitar pérdida
  // de cookies escritas en llamadas previas del mismo ciclo.
  let response = NextResponse.next({ request })

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallo seguro: si faltan variables de entorno, dejamos pasar
  if (!supabaseUrl || !supabaseAnonKey) return response

  // ✅ FIX 2: API moderna de @supabase/ssr — getAll/setAll
  // en lugar de get/set/remove individuales.
  //
  // El problema con set/remove era que cada llamada hacía:
  //   response = NextResponse.next(...)   ← nuevo objeto
  // Si Supabase llamaba set() dos veces, la segunda creaba
  // un NextResponse vacío y borraba las cookies de la primera.
  //
  // Con setAll, TODAS las cookies se escriben en un solo
  // NextResponse.next(), eliminando la carrera de escritura.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Paso 1: escribir en el request (para SSR downstream)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        // Paso 2: un solo NextResponse.next() con todas las cookies
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANTE: getUser() hace una llamada a la API de Supabase
  // para validar el token. Es más seguro que getSession() que
  // solo lee la cookie sin verificar con el servidor.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const matchesPath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)

  const isAuthOnlyPath = AUTH_ONLY_PATHS.some(matchesPath)

  // ── Guardia 1: Ruta protegida sin sesión → /login ────────
  // AUTH_ONLY_PATHS nunca entran aquí (evita /login → /login?redirectedFrom=/login
  // por colisión con el prefijo protegido /log).
  const isProtected =
    !isAuthOnlyPath && PROTECTED_PREFIXES.some(matchesPath)

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Guardia 2: Usuario logueado en ruta de auth → / ──────
  // Evita que alguien autenticado vea /login o /register.
  if (user && isAuthOnlyPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Todo lo demás (incluye / para usuarios no logueados) ──
  // No hay redirección: / es pública por diseño.
  return response
}

export const config = {
  matcher: [
    // Excluye archivos estáticos, imágenes y rutas de API
    // para no ejecutar el middleware en recursos que no lo necesitan
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}