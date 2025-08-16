import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
    * @route   GET /api/admin/catalogs?institution=...
    * @desc    Retrieves all catalogs for a specific institution
    * @access  Private - admin role required
    *
    * @query   {string} institution - ID of the institution
    *
    * @returns {200} Returns the list of catalogs
    * @returns {400} Missing institution ID
    * @returns {401} Not authorized
    * @returns {500} Internal server error
*/

export async function GET(req: Request) {

    // 1. Verify user and role
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }
    
    const { data: supabaseRolesData } = await supabase.from('roles').select('role').eq('user_id', user.id).maybeSingle()
    if (supabaseRolesData?.role != 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }


    // 2. Verify params
    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institution')
    if (!institutionId) {
        return NextResponse.json({ error: 'Missing institution ID' }, { status: 400 })
    }

    // 3. Retrieve catalogs
    const { data: supabaseCatalogsData, error: supabaseCatalogsError } = await supabase
        .from('catalogs')
        .select('*')
        .eq('institution_id', institutionId)


    if (supabaseCatalogsError) {
        return NextResponse.json({ error: "Institution not found" }, { status: 400 })
    }

    // 4. Return response
    return NextResponse.json(supabaseCatalogsData, { status: 200 })
}
