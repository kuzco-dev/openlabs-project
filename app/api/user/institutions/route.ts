import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: supabaseDataInstitutions } = await supabase
        .from("institutions")
        .select('*')
    
    return NextResponse.json(supabaseDataInstitutions);
}