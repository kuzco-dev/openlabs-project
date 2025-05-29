import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
    * @route   GET /api/admin/orders?catalog=...
    * @desc    Retrieves all orders linked to a catalog
    * @access  Private - admin role required
    * 
    * @query   {string} catalog - ID of the catalog
    *
    * @returns {200} Returns the list of orders
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
    if (supabaseRolesData?.role != 'admin' || supabaseRolesError) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Verify params
    const { searchParams } = new URL(req.url)
    const catalogId = searchParams.get('catalog')
    if (!catalogId) {
        return NextResponse.json({ error: "Missing catalog ID" }, { status: 400 })
    }

    // 3. Retrieve orders
    const { data: supabaseOrdersData, error: supabaseOrdersError } = await supabase
    .from('orders')
    .select('id, status, created_at, end_date, user_id')
    .eq('catalog_id', catalogId)

    if (supabaseOrdersError) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    // 4. Add items in order
    const enrichedOrders = await Promise.all(
        supabaseOrdersData.map(async (order) => {
            const { count, error: countError } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id)

            if (countError) {
                return NextResponse.json({ error: "Internal error" }, { status: 500 })
            }

            return {
                id: order.id,
                status: order.status,
                creation_date: order.created_at,
                end_date: order.end_date,
                n_items: count ?? 0,
            }
        })
    )

    // 5. Return response
    return NextResponse.json(enrichedOrders)
}