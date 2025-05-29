import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/catalogs/overview?institution=...&catalog=...
 * @desc    Retrieves the summary (number of orders and items) for a specific catalog
 * @access  Private - authenticated users only
 * 
 * @query   {string} institution - ID of the institution
 * @query   {string} catalog - ID of the catalog
 * 
 * @returns {200} Returns summary of total orders and items
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

    // 6. Handle any counting errors
    if (ordersError || itemsError) {
        return NextResponse.json({
        error: 'Error while counting data',
        details: { ordersError, itemsError }
        }, { status: 500 })
    }

    // 7. Return summary
    return NextResponse.json({
        total_orders: total_orders ?? 0,
        total_items: total_items ?? 0
    }, { status: 200 })
    }
