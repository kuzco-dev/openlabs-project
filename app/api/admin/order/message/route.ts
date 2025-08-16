import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check if user is admin
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleError || roleData?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Not authorized' },
      { status: 403 }
    )
  }

  // Get messages for the order
  const { data: messages, error: messagesError } = await supabase
    .from('order_messages')
    .select('id, message, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (messagesError) {
    return NextResponse.json(
      { error: 'Error fetching messages' },
      { status: 500 }
    )
  }

  return NextResponse.json({ messages: messages || [] })
} 