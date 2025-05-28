import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const catalogId = searchParams.get('catalog')

  if (!catalogId) {
    return NextResponse.json({ error: "ID de catalogue manquant" }, { status: 400 })
  }

  // 1. Récupérer les commandes du catalogue
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, status, created_at, end_date, user_id')
    .eq('catalog_id', catalogId)

  if (orderError) {
    console.error(orderError)
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // 2. Ajouter juste le nombre d'items
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id)

      if (countError) {
        console.error(countError)
      }

      return {
        id: order.id,
        status: order.status,
        creation_date: order.created_at,
        end_date: order.end_date,
        n_items: count ?? 0,
      }
    })
  )

  return NextResponse.json(enrichedOrders)
}