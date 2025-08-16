import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
    * @route   GET /api/admin/items?catalog=...
    * @desc    Retrieves all items linked to a catalog
    * @access  Private - admin role required
    * 
    * @query   {string} catalog - ID of the catalog
    *
    * @returns {200} Returns the list of items
    * @returns {400} Missing catalog ID
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
    const { data: supabaseRolesData, error: supabaseRolesError } = await supabase.from('roles').select('role').eq('user_id', user.id).maybeSingle()
    if (supabaseRolesData?.role != 'admin' ) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Verify params
    const { searchParams } = new URL(req.url)
    const catalogId = searchParams.get('catalog')
    if (!catalogId) {
        return NextResponse.json({ error: 'Missing catalog ID' }, { status: 400 })
    }

    // 3. Retrieve items with type names
    const { data: supabaseItemsData, error: supabaseItemsError } = await supabase
        .from('items')
        .select(`
            *,
            items_types!items_item_type_id_fkey (
                name
            )
        `)
        .eq('catalog_id', catalogId)

    // 4. Return response
    return NextResponse.json(supabaseItemsData, { status: 200 })
}