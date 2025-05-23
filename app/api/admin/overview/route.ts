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
  const catalogId = searchParams.get('catalog')

  if (!institutionId || !catalogId) {
    return NextResponse.json({ error: 'Erreur paramètre' }, { status: 400 })
  }

  // Vérification que le catalog appartient bien à cette institution
  const { data: catalog, error: catalogError } = await supabase
    .from('catalogs')
    .select('id')
    .eq('id', catalogId)
    .eq('institution_id', institutionId)
    .single()

  if (catalogError || !catalog) {
    return NextResponse.json({ error: 'Catalog non trouvé ou non autorisé' }, { status: 404 })
  }

  // Total commandes
  const { count: total_orders, error: ordersError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('catalog_id', catalogId)

  // Total items
  const { count: total_items, error: itemsError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('catalog_id', catalogId)

  if (ordersError || itemsError) {
    return NextResponse.json({
      error: 'Erreur lors du comptage',
      details: { ordersError, itemsError }
    }, { status: 500 })
  }

  return NextResponse.json({
    total_orders: total_orders ?? 0,
    total_items: total_items ?? 0
  })
}
