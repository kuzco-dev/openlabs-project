import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * @route   GET /api/admin/types?catalog=...
 * @desc    Retrieves all item types for a specific catalog
 * @access  Private - authenticated users only
 * 
 * @query   {string} catalog - ID of the catalog
 * 
 * @returns {200} Returns array of item types
 * @returns {400} Missing query parameters
 * @returns {401} Not authorized (not logged in)
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
    const catalogId = searchParams.get('catalog')

    if (!catalogId) {
        return NextResponse.json({ error: 'Missing catalog parameter' }, { status: 400 })
    }

    // 3. Fetch item types for the catalog
    const { data: itemTypes, error: supabaseItemTypesError } = await supabase
        .from('items_types')
        .select('id, name, created_at, catalog_id')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })

    if (supabaseItemTypesError) {
        return NextResponse.json({
            error: 'Error fetching item types',
            details: supabaseItemTypesError
        }, { status: 500 })
    }

    return NextResponse.json(itemTypes || [], { status: 200 })
} 