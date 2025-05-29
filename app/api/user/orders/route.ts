import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Vérifier l'authentification
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Récupérer les commandes de l'utilisateur avec les détails des items
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id,
                status,
                created_at,
                catalog_id,
                end_date,
                catalog:catalogs (
                    name,
                    acronym
                ),
                order_items (
                    quantity,
                    item:items (
                        name,
                        description
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (ordersError) {
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des commandes' },
                { status: 500 }
            )
        }

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Error in GET /api/user/orders:', error)
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
