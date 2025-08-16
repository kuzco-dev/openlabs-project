import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/items/stat?item=...
 * @desc    Retrieves item statistics including stock, available, and borrowed quantities
 * @access  Private - admin role required
 * 
 * @query   {string} item - ID of the item
 * 
 * @returns {200} Returns item statistics
 * @returns {400} Missing item ID
 * @returns {401} Not authorized (not logged in or not admin)
 * @returns {404} Item not found
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

    // 2. Extract parameters
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('item')

    if (!itemId) {
        return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    // 3. Verify the item exists and get its details
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name, description, default_quantity, actual_quantity')
        .eq('id', itemId)
        .single()

    if (itemError || !item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // 4. Calculate borrowed quantity (items in ongoing orders)
    // First get all ongoing order IDs
    const { data: ongoingOrders, error: ongoingOrdersError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', false)

    if (ongoingOrdersError) {
        return NextResponse.json({
            error: 'Error while fetching ongoing orders',
            details: ongoingOrdersError
        }, { status: 500 })
    }

    // Then get borrowed items from these orders
    const { data: borrowedItems, error: borrowedError } = await supabase
        .from('order_items')
        .select('quantity')
        .eq('item_id', itemId)
        .in('order_id', ongoingOrders?.map(order => order.id) || [])

    if (borrowedError) {
        return NextResponse.json({
            error: 'Error while calculating borrowed items',
            details: borrowedError
        }, { status: 500 })
    }

    // Calculate total borrowed quantity
    const total_borrowed = borrowedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0

    // 5. Return item statistics
    return NextResponse.json({
        item: {
            id: item.id,
            name: item.name,
            description: item.description,
            default_quantity: item.default_quantity,
            actual_quantity: item.actual_quantity
        },
        statistics: {
            total_stock: item.default_quantity,
            available_stock: item.actual_quantity,
            borrowed_stock: total_borrowed
        }
    }, { status: 200 })
} 