import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
    // 1. Verify user and role
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }
    const { data: supabaseRolesData, error: supabaseRolesError } = await supabase.from('roles').select('role').eq('user_id', user.id).maybeSingle()
    if (supabaseRolesData?.role != 'admin' || supabaseRolesError) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Verify params
    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institution')
    if (!institutionId) {
        return NextResponse.json({ error: "Missing institution ID" }, { status: 400 })
    }

    // 3. Get students list (just emails)
    const { data: students, error: studentsError } = await supabase
        .from('institution_list')
        .select('id, email, created_at')
        .eq('institution_id', institutionId)

    if (studentsError) {
        console.error('Error fetching students:', studentsError)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    return NextResponse.json(students)
} 