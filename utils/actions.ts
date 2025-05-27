'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { 
    loginSchema, 
    LoginSchemaType, 
    signupSchema,
    SignupSchemaType, 
    createItemSchema, 
    CreateItemSchemaType 
} from './schemas'

/*
Server Action: login form submission.
    - Validates form using Zod schema
    - Authenticates user via Supabase
    - On success: redirects to /admin
    - On failure: returns structured error response
*/
export async function login(prevState: any, data: unknown) {
    if (!(data instanceof FormData)) {
        return { 
            success: false, 
            message: 'Invalid data format' 
        }
    }
    const formObject = Object.fromEntries(data.entries())
    const formValid = loginSchema.safeParse(formObject)
    if (!formValid.success) {
        const zodErrors = formValid.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors)
            .flat()
            .join(', ')
        return {
            success: false,
            message: messages || 'Invalid data format',
        }
    }
    const validData: LoginSchemaType = formValid.data
    const supabase = await createClient()
    const { data: supabaseSigninData, error: supabaseSingninError } = await supabase.auth.signInWithPassword({
        email: validData.email,
        password: validData.password,
    })
    if (supabaseSingninError) {
        return { 
            success: false, 
            message: 'Internal error, try later' 
        }
    }
    const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', supabaseSigninData.user.id)
    .single()
    if (roleError || !roleData?.role) {
        return {
        success: false,
        message: 'Could not fetch user role',
        }
    }
    const redirectPath = roleData.role === 'admin' ? '/admin' : '/user'
    redirect(redirectPath)
}

/*
Server Action: signup form submission.
    - Validates form using Zod schema
    - Registers user via Supabase auth
    - Inserts user role in 'roles' table
    - On success: redirects to /admin
    - On failure: returns structured error response
*/
export async function signup(prevState: any, data: unknown) {
    if (!(data instanceof FormData)) {
        return { 
            success: false, 
            message: 'Invalid data format' 
        }
    }
    const formObject = Object.fromEntries(data.entries())
    const formValid = signupSchema.safeParse(formObject)
    if (!formValid.success) {
        const zodErrors = formValid.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors)
            .flat()
            .join(', ')
        return {
            success: false,
            message: messages || 'Invalid data format',
        }
    }
    const validData: SignupSchemaType = formValid.data
    const supabase = await createClient()
    const { data: supabaseSignupData, error: supabaseSignupError } = await supabase.auth.signUp({
        email: validData.email,
        password: validData.password,
    })
    if (supabaseSignupError) {
        return { 
            success: false, 
            message: 'Internal error, try later' 
        }
    }
    const { error: supabseRolesError } = await supabase
    .from('roles')
    .insert({
        user_id: supabaseSignupData?.user?.id,
        role: validData.role,
    })
    if (supabseRolesError) {
        return {
            success: false,
            message: 'Internal error, try later'
        }
    }
    const redirectPath = validData.role === 'admin' ? '/admin' : '/user'
    redirect(redirectPath)
}

/*
Server Action: admin item form submission.
    - Validates form using Zod schema
*/
export async function adminCreateItem(catalogId: string,prevState: any, formData: unknown) {

    if (!(formData instanceof FormData)) {
      return {
        success: false,
        message: 'Invalid data format',
      }
    }
    const formObject = Object.fromEntries(formData.entries())
    const formResult = createItemSchema.safeParse(formObject)
    if (!formResult.success) {
      const zodErrors = formResult.error.flatten()
      const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
      return {
        success: false,
        message: messages || 'Invalid input',
      }
    }
    const validData: CreateItemSchemaType = formResult.data

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
  
    if (userError || !userData?.user?.id) {
      return {
        success: false,
        message: 'Authentication error',
      }
    }
  
    const { error: supabaseItemsError } = await supabase
      .from('items')
      .insert({
        name: validData.item_name,
        description: validData.item_description,
        quantity: Number(validData.item_quantity),
        catalog_id: catalogId,
      })
    if (supabaseItemsError) {
      return {
        success: false,
        message: 'Internal error, try later',
      }
    }
    return {
      success: true,
      message: 'Item created successfully',
    }
}

/*
Server Action: User institutions form submission.
    - Validates form using Zod schema
*/
export async function userAddInstitutions(prevState: any, data: unknown) {
    if (!(data instanceof FormData)) {
      return {
        success: false,
        message: 'Invalid data format',
      }
    }
  
    const institutionsRaw = data.get('institutions')
    if (!institutionsRaw || typeof institutionsRaw !== 'string') {
      return {
        success: false,
        message: 'Missing institution data',
      }
    }
  
    const institutionIds = JSON.parse(institutionsRaw) as string[]
  
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
      }
    }
  
    const insertData = institutionIds.map(institution_id => ({
      user_id: user.id,
      institution_id,
    }))
  
    await supabase
      .from('institution_list')
      .insert(insertData)
  
    return {
      success: true,
      message: 'Institutions added successfully',
    }
}

type OrderItem = {
  item_id: string
  quantity: number
}

export async function userCreateOrder(catalogId: string, items: OrderItem[]) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false,
      message: 'Utilisateur non authentifié'
    }
  }

  // Vérifier les quantités disponibles
  const { data: availableItems, error: itemsError } = await supabase
    .from('items')
    .select('id, actual_quantity')
    .in('id', items.map(item => item.item_id))

  if (itemsError) {
    return {
      success: false,
      message: 'Erreur lors de la vérification des quantités'
    }
  }

  // Vérifier que toutes les quantités sont disponibles
  for (const item of items) {
    const availableItem = availableItems.find(i => i.id === item.item_id)
    if (!availableItem || availableItem.actual_quantity < item.quantity) {
      return {
        success: false,
        message: 'Quantité insuffisante pour certains items'
      }
    }
  }

  // Start a transaction
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: false, // false = pending
      catalog_id: catalogId,
      user_id: user.id
    })
    .select()
    .single()

  if (orderError || !order) {
    return {
      success: false,
      message: 'Erreur lors de la création de la commande'
    }
  }

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    item_id: item.item_id,
    quantity: item.quantity
  }))

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    // If there's an error, we should probably delete the order
    await supabase
      .from('orders')
      .delete()
      .eq('id', order.id)

    return {
      success: false,
      message: 'Erreur lors de l\'ajout des items à la commande'
    }
  }

  // Mettre à jour les quantités disponibles
  for (const item of items) {
    const availableItem = availableItems.find(i => i.id === item.item_id)
    if (!availableItem) continue

    const { error: updateError } = await supabase
      .from('items')
      .update({ 
        actual_quantity: availableItem.actual_quantity - item.quantity
      })
      .eq('id', item.item_id)

    if (updateError) {
      // En cas d'erreur, on devrait annuler la commande
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)
      
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id)

      return {
        success: false,
        message: 'Erreur lors de la mise à jour des quantités'
      }
    }
  }

  return {
    success: true,
    message: 'Commande créée avec succès'
  }
}