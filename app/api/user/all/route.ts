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

    // 2. Retrieves insitutions linked to a user
    const { data: supabaseInstitutionListData, error: supabaseInstitutionListError } = await supabase.from('institution_list').select('institution_id').eq('user_id', user.id)
    if (supabaseInstitutionListError) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
    const institutionIds = supabaseInstitutionListData.map((inst) => inst.institution_id)
    if (institutionIds.length === 0) {
        return NextResponse.json([])
    }

    // 3. Retrieves all catalogs linked to insitutions 
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

    // 4. Return response
    return NextResponse.json(supabaseInstitutionsData)
}
