import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const institutionId = searchParams.get('institution')
  if (!institutionId) {
    return NextResponse.json({ error: 'ID de l’institution manquant' }, { status: 400 })
  }
  const { data: catalogs, error } = await supabase
    .from('catalogs')
    .select('*')
    .eq('institution_id', institutionId)
  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(catalogs)
}
