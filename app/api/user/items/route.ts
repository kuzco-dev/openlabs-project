import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Vérifier que l'utilisateur est authentifié
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Récupérer le paramètre catalog_id dans l'URL
  const { searchParams } = new URL(request.url)
  const catalogId = searchParams.get('catalog_id')

  if (!catalogId) {
    return NextResponse.json({ error: 'catalog_id parameter is required' }, { status: 400 })
  }

  // Récupérer les items pour ce catalog_id
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, description, default_quantity, actual_quantity, created_at, catalog_id')
    .eq('catalog_id', catalogId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Ajouter l'URL de l'image pour chaque item
  const itemsWithImages = items.map(item => ({
    ...item,
    image_url: `https://nlksqlrtcnecvdzrgmyd.supabase.co/storage/v1/object/public/items/${item.id}.jpg`
  }))

  return NextResponse.json(itemsWithImages)
}
