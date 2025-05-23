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

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    if (!user) {
    // Si non connecté → autoriser uniquement / et /signup
    if (pathname !== '/' && pathname !== '/signup') {
        return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
    }

    // Connecté → récupérer le rôle
    const { data: roleData } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

    const role = roleData?.role

    // Redirection si connecté mais sur / ou /signup
    if (pathname === '/' || pathname === '/signup') {
    const redirectPath = role === 'admin' ? '/admin' : '/user'
    return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Protection de route
    if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/user') && role !== 'user') {
    return NextResponse.redirect(new URL('/', request.url))
    }
    
    return supabaseResponse
}