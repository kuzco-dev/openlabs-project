import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Auth
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('Auth error:', authError)
    return NextResponse.redirect(new URL('/', request.url))
  }

  const user = userData?.user
  const pathname = request.nextUrl.pathname

  if (!user) {
    if (pathname !== '/' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // Get user role
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleError || !roleData) {
    console.error('Role fetch error:', roleError)
    return NextResponse.redirect(new URL('/', request.url))
  }

  const role = roleData.role

  // Redirection après login
  if (pathname === '/' || pathname === '/signup') {
    const redirectPath = role === 'admin' ? '/admin' : '/user'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Protection de routes
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/user') && role !== 'user') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}
