import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
    * @route   GET /api/user/orders
    * @desc    Retrieves all orders for the authenticated user
    * @access  Private - user role required
    *
    * @returns {200} Returns the list of orders with their details
    * @returns {401} Not authorized
    * @returns {500} Internal server error
*/

export async function GET() {
    try {
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

        // 2. Retrieve orders
        const { data: supabaseOrdersData, error: supabaseOrdersError } = await supabase
            .from('orders')
            .select(`
                id,
                status,
                created_at,
                catalog_id,
                end_date,
                catalog:catalogs (
                    name,
                    acronym
                ),
                order_items (
                    quantity,
                    item:items (
                        name,
                        description
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (supabaseOrdersError) {
            return NextResponse.json(
                { error: 'Internal error' },
                { status: 500 }
            )
        }

        // 3. Return response
        return NextResponse.json(supabaseOrdersData)
    } catch {
        return NextResponse.json(
            { error: 'Internal error' },
            { status: 500 }
        )
    }
}
