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
    .select('id, status, created_at, end_date, user_id, validation')
    .eq('catalog_id', catalogId)

    if (supabaseOrdersError) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    // 4. Get all item types for this catalog
    const { data: allItemTypes, error: itemTypesError } = await supabase
        .from('items_types')
        .select('id, name')
        .eq('catalog_id', catalogId)

    if (itemTypesError) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }

    // 5. Add items in order and user emails
    const enrichedOrders = await Promise.all(
        supabaseOrdersData.map(async (order) => {
            // Get order items
            const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                quantity,
                items (
                    name,
                    serial_number,
                    item_type_id,
                    items_types (
                        name
                    )
                )
            `)
            .eq('order_id', order.id)

            

            // Get user email from profiles
            const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', order.user_id)
            .single()
            

            const formattedItems = orderItems?.map(item => {
                // Type assertion with unknown as intermediate step
                const itemsData = item.items as unknown as { 
                    name: string; 
                    serial_number?: string;
                    item_type_id?: string;
                    items_types?: { name: string } | null;
                }
                return {
                    name: itemsData.name || 'Unknown',
                    serial_number: itemsData.serial_number || null,
                    item_type: itemsData.items_types?.name || null,
                    quantity: item.quantity
                }
            }) || []

            return {
                id: order.id,
                status: order.status,
                creation_date: order.created_at,
                end_date: order.end_date,
                validation: order.validation,
                n_items: orderItems?.length ?? 0,
                user_email: profileData?.email || 'N/A',
                items: formattedItems
            }
        })
    )

    // 6. Return response with orders and item types
    return NextResponse.json({
        orders: enrichedOrders,
        itemTypes: allItemTypes || []
    }, { status: 200 })
}