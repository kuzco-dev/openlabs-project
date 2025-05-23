import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "error" });
    }
    const { data: supabaseInstitutionsData } = await supabase
        .from("institutions")
        .select('*')
        .eq('creator_id', user.id);
    
    return NextResponse.json(supabaseInstitutionsData);
}