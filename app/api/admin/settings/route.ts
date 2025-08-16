import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
    * @route   GET /api/admin/settings?institution=...
    * @desc    Retrieves inistitution and catalog data
    * @access  Private - admin role required
    *
    * @query   {string} institution - ID of the institution
    *
    * @returns {200} Returns the list of institution and catalog data
    * @returns {400} Missing institution ID
    * @returns {401} Not authorized
    * @returns {500} Internal server error
*/

export async function GET(request: Request) {

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

    // 2. Extract parameters
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institution')
    if (!institutionId) {
        return NextResponse.json(
            { error: 'Missing institution ID' },
            { status: 400 }
        )
    }

    // 3. Fetch institution with its catalogs
    const { data: institution, error: institutionError } = await supabase
        .from('institutions')
        .select(`
            *,
            catalogs (*)
        `)
        .eq('id', institutionId)
        .single()
    if (institutionError) {
        return NextResponse.json(
            { error: 'Internal error' },
            { status: 500 }
        )
    }

    // 4. Return response
    return NextResponse.json(institution, { status: 200 } )
} 