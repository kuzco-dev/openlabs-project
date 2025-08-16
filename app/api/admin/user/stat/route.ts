import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/user/stat?user=...
 * @desc    Retrieves user statistics including orders and delays
 * @access  Private - admin role required
 * 
 * @query   {string} user - ID of the user
 * 
 * @returns {200} Returns user statistics
 * @returns {400} Missing user ID
 * @returns {401} Not authorized (not logged in or not admin)
 * @returns {404} User not found
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
    const userId = searchParams.get('user')

    if (!userId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // 3. Verify the user exists
    const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, delays')
        .eq('id', userId)
        .single()

    if (userError || !userProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 4. Count total orders for the user (both returned and loan in progress)
    const { count: total_orders, error: totalOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    // 5. Count ongoing orders (status = false)
    const { count: ongoing_orders, error: ongoingOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', false)

    // 6. Count returned orders (status = true)
    const { count: returned_orders, error: returnedOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', true)

    // 7. Handle any counting errors
    if (totalOrdersError || ongoingOrdersError || returnedOrdersError) {
        return NextResponse.json({
            error: 'Error while counting orders',
            details: { totalOrdersError, ongoingOrdersError, returnedOrdersError }
        }, { status: 500 })
    }

    // 8. Return user statistics
    return NextResponse.json({
        user: {
            id: userProfile.id,
            email: userProfile.email,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            delays: userProfile.delays
        },
        statistics: {
            total_orders: total_orders ?? 0,
            ongoing_orders: ongoing_orders ?? 0,
            returned_orders: returned_orders ?? 0
        }
    }, { status: 200 })
} 