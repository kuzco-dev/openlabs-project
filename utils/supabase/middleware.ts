export const runtime = 'nodejs'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    try {
      let supabaseResponse = NextResponse.next({ request })
  
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )
  
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error fetching user:', userError)
        return NextResponse.redirect(new URL('/', request.url))
      }
  
      const pathname = request.nextUrl.pathname
  
      if (!user) {
        if (pathname !== '/' && pathname !== '/signup') {
          return NextResponse.redirect(new URL('/', request.url))
        }
        return supabaseResponse
      }
  
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
  
      if (roleError) {
        console.error('Error fetching role:', roleError)
        return NextResponse.redirect(new URL('/', request.url))
      }
  
      const role = roleData?.role
  
      if (pathname === '/' || pathname === '/signup') {
        const redirectPath = role === 'admin' ? '/admin' : '/user'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
  
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
  
      if (pathname.startsWith('/user') && role !== 'user') {
        return NextResponse.redirect(new URL('/', request.url))
      }
  
      return supabaseResponse
    } catch (err) {
      console.error('Middleware error:', err)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  