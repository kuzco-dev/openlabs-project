import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
    * @route   GET /api/user/all
    * @desc    Retrieves all catalogs linked to a user
    * @access  Private - user role required
    *
    * @returns {200} Returns list of catalogs
    * @returns {401} Not authorized
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
    if (supabaseRolesData?.role != 'user' || supabaseRolesError) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Get user's email from profiles
    const { data: profile, error: profileError } = await supabase.from('profiles').select('email').eq('id', user.id).single()
    if (profileError || !profile?.email) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
    const userEmail = profile.email

    // 3. Retrieves institutions linked to the user's email
    const { data: supabaseInstitutionListData, error: supabaseInstitutionListError } = await supabase.from('institution_list').select('institution_id').eq('email', userEmail)
    if (supabaseInstitutionListError) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
    const institutionIds = supabaseInstitutionListData.map((inst) => inst.institution_id)
    if (institutionIds.length === 0) {
        return NextResponse.json([])
    }

    // 4. Retrieves all catalogs linked to institutions 
    const { data: supabaseInstitutionsData, error: supabaseInstitutionsError } = await supabase
    .from('institutions')
    .select(`
    id,
    name,
    acronym,
    catalogs (
        id,
        name,
        acronym
    )
    `)
    .in('id', institutionIds)
    if (supabaseInstitutionsError) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    // 5. Return response
    return NextResponse.json(supabaseInstitutionsData)
}
