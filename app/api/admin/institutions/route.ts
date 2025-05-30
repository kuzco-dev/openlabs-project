import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';


/**
    * @route   GET /api/admin/institutions
    * @desc    Retrieves insitutions linked to an admin
    * @access  Private - admin role required
    *
    * @returns {200} Returns the list of institutions
    * @returns {400} Missing institution ID
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
    if (supabaseRolesData?.role != 'admin' || supabaseRolesError) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // 2. Retrieve institutions 
    const { data: supabaseInstitutionsData } = await supabase.from("institutions").select('*').eq('creator_id', user.id);
    
    // 3. Return response
    return NextResponse.json(supabaseInstitutionsData);
}