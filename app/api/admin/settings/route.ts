import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institution')

    if (!institutionId) {
        return NextResponse.json(
            { error: 'Institution ID is required' },
            { status: 400 }
        )
    }

    const supabase = await createClient()

    // Fetch institution with its catalogs
    const { data: institution, error: institutionError } = await supabase
        .from('institutions')
        .select(`
            *,
            catalogs (*)
        `)
        .eq('id', institutionId)
        .single()

    if (institutionError) {
        return NextResponse.json(
            { error: 'Failed to fetch institution' },
            { status: 500 }
        )
    }

    return NextResponse.json(institution)
} 