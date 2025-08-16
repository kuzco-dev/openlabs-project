import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/user/all
 * @desc    Retrieves all users with their ID and email
 * @access  Private - admin role required
 * 
 * @returns {200} Returns list of users
 * @returns {401} Not authorized (not logged in or not admin)
 * @returns {500} Internal server error
 */
export async function GET() {
  
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

    // 2. Get all users from profiles table
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .order('email', { ascending: true })

    if (usersError) {
        return NextResponse.json({
            error: 'Error while fetching users',
            details: usersError
        }, { status: 500 })
    }

    // 3. Return users list
    return NextResponse.json(users || [], { status: 200 })
} 