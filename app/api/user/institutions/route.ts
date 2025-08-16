import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
    * @route   GET /api/user/all
    * @desc    Retrieves all catalogs linked to a user
    * @access  Private - user role required
    *
    * @returns {200} Returns list of institutions
    * @returns {401} Not authorized
    * @returns {500} Internal server error
*/

export async function GET() {

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

    // 2. Retrieves all institutions
    const { data: supabaseDataInstitutions } = await supabase.from("institutions").select('*')
    
    // 3. Return response
    return NextResponse.json(supabaseDataInstitutions,  { status: 200 });
}