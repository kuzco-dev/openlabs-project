import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/overview?institution=...&catalog=...
 * @desc    Retrieves order statistics and chart data for the last 30 days
 * @access  Private - authenticated users only
 * 
 * @query   {string} institution - ID of the institution
 * @query   {string} catalog - ID of the catalog
 * 
 * @returns {200} Returns summary and chart data
 * @returns {400} Missing query parameters
 * @returns {401} Not authorized (not logged in)
 * @returns {404} Catalog not found or does not belong to the institution
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
    const institutionId = searchParams.get('institution')
    const catalogId = searchParams.get('catalog')

    if (!institutionId || !catalogId) {
        return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 })
    }

    // 3. Ensure the catalog belongs to the given institution
    const { data: catalog, error: catalogError } = await supabase
        .from('catalogs')
        .select('id')
        .eq('id', catalogId)
        .eq('institution_id', institutionId)
        .single()

    if (catalogError || !catalog) {
        return NextResponse.json({ error: 'Catalog not found' }, { status: 404 })
    }

    // 4. Count total orders for the catalog
    const { count: total_orders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('catalog_id', catalogId)

    // 5. Count total items for the catalog
    const { count: total_items, error: itemsError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('catalog_id', catalogId)

    // 5.5. Count total users for the institution
    const { count: total_users, error: usersError } = await supabase
        .from('institution_list')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)

    // 6. Count orders that have exceeded their end date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: overdue_orders, error: overdueError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('catalog_id', catalogId)
        .eq('status', false) // Only ongoing orders
        .lt('end_date', today.toISOString()) // end_date is in the past

    // 7. Get orders for the last 30 days for chart data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Get all orders for the catalog created in the last 30 days
    const { data: allOrders, error: chartOrdersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('catalog_id', catalogId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

    // 8. Handle any counting errors
    if (ordersError || itemsError || usersError || chartOrdersError || overdueError) {
        return NextResponse.json({
        error: 'Error while counting data',
        details: { ordersError, itemsError, usersError, chartOrdersError, overdueError }
        }, { status: 500 })
    }

    // 9. Process chart data - calculate orders created for each day
    const chartData = []
    
    // Get current date and format it properly for date comparison
    const now = new Date()
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(currentDate)
        date.setDate(date.getDate() - i)
        
        // Format date as YYYY-MM-DD for comparison
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Count orders created on this specific date
        const ordersCreatedOnDate = allOrders?.filter(order => {
            const orderDate = new Date(order.created_at)
            const orderYear = orderDate.getFullYear()
            const orderMonth = String(orderDate.getMonth() + 1).padStart(2, '0')
            const orderDay = String(orderDate.getDate()).padStart(2, '0')
            const orderDateStr = `${orderYear}-${orderMonth}-${orderDay}`
            return orderDateStr === dateStr
        }) || []
        
        chartData.push({
            date: dateStr,
            orders: ordersCreatedOnDate.length
        })
    }

    // 10. Return summary and chart data
    return NextResponse.json({
        total_orders: total_orders ?? 0,
        total_items: total_items ?? 0,
        total_users: total_users ?? 0,
        overdue_orders: overdue_orders ?? 0,
        chart_data: chartData
    }, { status: 200 })
    }
