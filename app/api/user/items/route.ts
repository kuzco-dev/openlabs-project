import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
    * @route   GET /api/user/items
    * @desc    Retrieves all catalogs linked to a user
    * @access  Private - user role required
    *
    * @returns {200} Returns list of items
    * @returns {400} Missing catalog ID
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
    if (supabaseRolesData?.role != 'user' || supabaseRolesError) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Verify params
    const { searchParams } = new URL(request.url)
    const catalogId = searchParams.get('catalog_id')
    if (!catalogId) {
        return NextResponse.json({ error: 'Missing catalog ID' }, { status: 400 })
    }

    // 3. Retrieves all items
    const { data: items, error } = await supabase
        .from('items')
        .select('id, name, description, default_quantity, actual_quantity, created_at, catalog_id')
        .eq('catalog_id', catalogId)
    if (error) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    // 4. Add link images
    const itemsWithImages = items.map(item => ({
        ...item,
        image_url: `https://nlksqlrtcnecvdzrgmyd.supabase.co/storage/v1/object/public/items/${item.id}.jpg`
    }))

    // 5. Return response
    return NextResponse.json(itemsWithImages)
}
