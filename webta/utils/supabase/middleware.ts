import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Memanggil getUser() akan me-refresh session jika kedaluwarsa.
  // getUser() juga lebih aman daripada getSession() karena langsung memvalidasi JWT ke server Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Daftar rute yang harus dicegah jika belum login
  const protectedPaths = [
    '/profile-setting',
    '/dashboard-user',
    '/dashboard-author',
    '/dashboard-mitra',
    '/dashboard-admin',
    '/minting',
    '/update-password'
  ]

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // Jika mencoba mengakses rute terlarang tanpa login, lempar ke /login
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Jika sudah login, jangan biarkan mengakses halaman /login
  if (pathname.startsWith('/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard-user' // atau rute utama
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
