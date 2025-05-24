import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 1. Récupérer les institutions liées à l'utilisateur via institution_list
  const { data: userInstitutions, error: instListError } = await supabase
    .from('institution_list')
    .select('institution_id')
    .eq('user_id', user.id)

  if (instListError || !userInstitutions) {
    return NextResponse.json({ error: 'Cannot fetch user institutions' }, { status: 500 })
  }

  const institutionIds = userInstitutions.map((inst) => inst.institution_id)

  if (institutionIds.length === 0) {
    return NextResponse.json([])
  }

  // 2. Récupérer les infos des institutions + leurs catalogs associés
  const { data: institutions, error } = await supabase
    .from('institutions')
    .select(`
      id,
      name,
      acronym,
      catalogs (
        id,
        name,
        acronym
      )
    `)
    .in('id', institutionIds)

  if (error) {
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 })
  }

  return NextResponse.json(institutions)
}
