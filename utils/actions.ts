'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { 
    loginSchema, 
    LoginSchemaType, 
    signupSchema,
    SignupSchemaType, 
    createItemSchema, 
    CreateItemSchemaType,
    createCatalogSchema,
    CreateCatalogSchemaType,
    createInstitutionSchema,
    CreateInstitutionSchemaType,
    createItemTypeSchema,
    CreateItemTypeSchemaType
} from './schemas'

import { revalidatePath } from 'next/cache'

// Verifier chaque sessions et role sur chaque server actions

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
    const { error: supabseProfilesError } = await supabase
    .from('profiles')
    .insert({
        id: supabaseSignupData?.user?.id,
        email: validData.email,
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

export async function signout() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut()
    redirect("/");
}

/*
Server Action: admin item form submission.
    - Validates form using Zod schema
    - Registers user via Supabase auth
*/
export async function adminCreateItem(catalogId: string, prevState: any, formData: unknown) {
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
  
    const { data: itemData, error: supabaseItemsError } = await supabase
      .from('items')
      .insert({
        name: validData.item_name,
        description: validData.item_description,
        default_quantity: Number(validData.item_quantity),
        actual_quantity: Number(validData.item_quantity),
        catalog_id: catalogId,
        serial_number: validData.serial_number || null,
        item_type_id: validData.item_type_id || null,
      })
      .select()
      .single()

    if (supabaseItemsError || !itemData) {
      return {
        success: false,
        message: 'Internal error, try later',
      }
    }

    if (validData.item_image) {
      const imageFile = validData.item_image
      const { error: uploadError } = await supabase
        .storage
        .from('items')
        .upload(`${itemData.id}.jpg`, imageFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        await supabase
          .from('items')
          .delete()
          .eq('id', itemData.id)

        return {
          success: false,
          message: 'Error uploading image',
        }
      }
    }
    
    return {
      success: true,
      message: 'Item created successfully',
    }
}

/*
Server Action: User institutions form submission.
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
        message: 'Authentication error',
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

/*
Server Action: User order creation.
*/
export async function userCreateOrder(catalogId: string, items: OrderItem[], returnDate: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false,
      message: 'Authentication error'
    }
  }

  const selectedDate = new Date(returnDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (selectedDate < today) {
    return {
      success: false,
      message: 'Return date cannot be earlier than today'
    }
  }

  const { data: availableItems, error: itemsError } = await supabase
    .from('items')
    .select('id, actual_quantity')
    .in('id', items.map(item => item.item_id))

  if (itemsError) {
    return {
      success: false,
      message: 'Internal error'
    }
  }

  for (const item of items) {
    const availableItem = availableItems.find(i => i.id === item.item_id)
    if (!availableItem || availableItem.actual_quantity < item.quantity) {
      return {
        success: false,
        message: 'Insufficient quantity for some items'
      }
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      status: false, 
      catalog_id: catalogId,
      user_id: user.id,
      end_date: returnDate
    })
    .select()
    .single()

  if (orderError || !order) {
    return {
      success: false,
      message: 'Internal error'
    }
  }

  const orderItems = items.map(item => ({
    order_id: order.id,
    item_id: item.item_id,
    quantity: item.quantity
  }))

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    await supabase
      .from('orders')
      .delete()
      .eq('id', order.id)

    return {
      success: false,
      message: 'Internal error'
    }
  }

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
        message: 'Internal error'
      }
    }
  }

  return {
    success: true,
    message: 'Order created successfully'
  }
}

/*
Server Action: admin catalog creation.
*/
export async function adminCreateCatalog(institutionId: string, prevState: any, data: unknown) {
    console.log(institutionId)
    console.log(prevState)
    console.log(data)

    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
        success: false,
        message: "Authentication error"
        }
    }

    if (!(data instanceof FormData)) {
        return {
          success: false,
          message: 'Invalid data format',
        }
    }
    const dataObject = Object.fromEntries(data.entries())
    const dataResult = createCatalogSchema.safeParse(dataObject)
    if (!dataResult.success) {
        const zodErrors = dataResult.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
        return {
            success: false,
            message: messages || 'Invalid input',
        }
    }
    const dataValid: CreateCatalogSchemaType = dataResult.data

    const { error: supabaseCatalogError } = await supabase
    .from('catalogs')
    .insert({
        name: dataValid.name,
        description: dataValid.description,
        acronym: dataValid.acronym,
        institution_id: institutionId,
    })
    if (supabaseCatalogError) {
        return {
            success: false,
            message: 'Internal error, try later',
        }
    }

    revalidatePath(`/admin/${institutionId}`, 'page')
    return {
        success: true,
        message: 'Catalog created successfully',
    }
}

/*
Server Action: Admin institution creation.
*/
export async function adminCreateInstitution(prevState: any, data: unknown){

    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Authentication error"
        }
    }

    if (!(data instanceof FormData)) {
        return {
            success: false,
            message: 'Invalid data format',
        }
    }
    const dataObject = Object.fromEntries(data.entries())
    const dataResult = createInstitutionSchema.safeParse(dataObject)
    if (!dataResult.success) {
        const zodErrors = dataResult.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
        return {
            success: false,
            message: messages || 'Invalid input',
        }
    }
    const dataValid: CreateInstitutionSchemaType = dataResult.data

    // Insert data
    const { error: supabaseCatalogError } = await supabase
    .from('institutions')
    .insert({
        name: dataValid.name,
        description: dataValid.description,
        acronym: dataValid.acronym,
        creator_id: supabaseUserData.user.id,
    })
    if (supabaseCatalogError) {
        return {
            success: false,
            message: 'Internal error, try later',
        }
    }

    revalidatePath('/admin', 'layout')
    return {
        success: true,
        message: 'Institution created successfully',
    }
}

/*
Server Action: Admin institution modification.
*/
export async function adminModifyInstitution(institutionId: string, prevState: any, data: unknown) {
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    if (!(data instanceof FormData)) {
        return {
            success: false,
            message: 'Invalid data format',
        }
    }
    const dataObject = Object.fromEntries(data.entries())
    const dataResult = createInstitutionSchema.safeParse(dataObject)
    if (!dataResult.success) {
        const zodErrors = dataResult.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
        return {
            success: false,
            message: messages || 'Invalid input',
        }
    }
    const dataValid: CreateInstitutionSchemaType = dataResult.data

    const { error: updateError } = await supabase
        .from('institutions')
        .update({
            name: dataValid.name,
            description: dataValid.description,
            acronym: dataValid.acronym,
        })
        .eq('id', institutionId)

    if (updateError) {
        return {
            success: false,
            message: 'Internal error, try later',
        }
    }

    revalidatePath('/admin', 'layout')
    return {
        success: true,
        message: 'Institution updated successfully',
    }
}

/*
Server Action: Admin catalog modification.
*/
export async function adminModifyCatalog(catalogId: string, prevState: any, data: unknown) {
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    if (!(data instanceof FormData)) {
        return {
            success: false,
            message: 'Invalid data format',
        }
    }
    const dataObject = Object.fromEntries(data.entries())
    const dataResult = createCatalogSchema.safeParse(dataObject)
    if (!dataResult.success) {
        const zodErrors = dataResult.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
        return {
            success: false,
            message: messages || 'Invalid input',
        }
    }
    const dataValid: CreateCatalogSchemaType = dataResult.data

    // Update data
    const { error: updateError } = await supabase
        .from('catalogs')
        .update({
            name: dataValid.name,
            description: dataValid.description,
            acronym: dataValid.acronym,
        })
        .eq('id', catalogId)

    if (updateError) {
        return {
            success: false,
            message: 'Internal error, try later',
        }
    }

    revalidatePath('/admin', 'layout')
    return {
        success: true,
        message: 'Catalog updated successfully',
    }
}

/*
Server Action: Admin catalog deletion.
*/
export async function adminDeleteCatalog(catalogId: string) {
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    const { error: deleteError } = await supabase
        .from('catalogs')
        .delete()
        .eq('id', catalogId)

    if (deleteError) {
        return {
            success: false,
            message: 'Error deleting catalog'
        }
    }

    revalidatePath('/admin', 'layout')
    return {
        success: true,
        message: 'Catalog deleted successfully'
    }
}

/*
Server Action: Admin institution deletion.
*/
export async function adminDeleteInstitution(institutionId: string) {
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    const { error: deleteError } = await supabase
        .from('institutions')
        .delete()
        .eq('id', institutionId)

    if (deleteError) {
        return {
            success: false,
            message: 'Error deleting institution'
        }
    }

    revalidatePath('/admin', 'layout')
    return {
        success: true,
        message: 'Institution deleted successfully'
    }
}

/*
Server Action: User order return date modification.
*/
export async function userUpdateOrderReturnDate(orderId: string, returnDate: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Unauthenticated user'
        }
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('user_id, status')
        .eq('id', orderId)
        .single()

    if (orderError || !order || order.user_id !== user.id) {
        return {
            success: false,
            message: 'Order not found or not authorized'
        }
    }

    if (order.status) {
        return {
            success: false,
            message: 'Unable to modify a completed order'
        }
    }

    const { error: updateError } = await supabase
        .from('orders')
        .update({ end_date: returnDate })
        .eq('id', orderId)

    if (updateError) {
        return {
            success: false,
            message: 'Internal error, try later'
        }
    }

    return {
        success: true,
        message: 'Return date successfully updated'
    }
}

/*
Server Action: User order finalization.
*/
export async function userFinalizeOrder(orderId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Unauthenticated user'
        }
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('user_id, status, end_date')
        .eq('id', orderId)
        .single()

    if (orderError || !order || order.user_id !== user.id) {
        return {
            success: false,
            message: 'Order not found or not authorized'
        }
    }

    if (order.status) {
        return {
            success: false,
            message: 'Order already completed'
        }
    }

    // Note: Stock will be incremented when admin validates the return
    // This prevents stock from being incremented immediately when user finalizes order

    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: true })
        .eq('id', orderId)

    if (updateError) {
        return {
            success: false,
            message: 'Internal error, try later'
        }
    }

    // Check if the order was finalized after the end date and add delay if needed
    if (order.end_date) {
        const endDate = new Date(order.end_date)
        const today = new Date()
        
        if (today > endDate) {
            // Order was finalized after the end date, increment delays count
            // First get current delays count
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('delays')
                .eq('id', user.id)
                .single()

            if (!profileError && profileData) {
                const { error: delayError } = await supabase
                    .from('profiles')
                    .update({ delays: profileData.delays + 1 })
                    .eq('id', user.id)

                if (delayError) {
                    console.error('Error updating delays count:', delayError)
                    // Don't fail the order finalization if delay update fails
                }
            }
        }
    }

    return {
        success: true,
        message: 'Order finalized successfully'
    }
}

/*
Server Action: Admin student addition.
*/
export async function adminAddStudent(institutionId: string, email: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Not authorized'
        }
    }
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    if (roleError || roleData?.role !== 'admin') {
        return {
            success: false,
            message: 'Not authorized'
        }
    }

    // Vérifier que l'email existe dans la table profiles
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (profileError || !profileData) {
        return {
            success: false,
            message: 'Email does not exist in the system'
        }
    }

    const { data: existingStudent, error: checkError } = await supabase
        .from('institution_list')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('email', email)
        .single()

    if (existingStudent) {
        return {
            success: false,
            message: 'Student is already in this institution'
        }
    }
    const { error: insertError } = await supabase
        .from('institution_list')
        .insert({
            institution_id: institutionId,
            email: email
        })

    if (insertError) {
        return {
            success: false,
            message: 'Error adding student to institution'
        }
    }

    return {
        success: true,
        message: 'Student added successfully'
    }
}

/*
Server Action: Admin student removal.
*/
export async function adminRemoveStudent(institutionId: string, studentId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Not authorized'
        }
    }
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    if (roleError || roleData?.role !== 'admin') {
        return {
            success: false,
            message: 'Not authorized'
        }
    }

    const { error: deleteError } = await supabase
        .from('institution_list')
        .delete()
        .eq('id', studentId)
        .eq('institution_id', institutionId)

    if (deleteError) {
        return {
            success: false,
            message: 'Error removing student from institution'
        }
    }

    return {
        success: true,
        message: 'Student removed successfully'
    }
}

/*
Server Action: Admin item type creation.
*/
export async function adminCreateItemType(catalogId: string, prevState: any, formData: unknown) {
    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: 'Invalid data format',
        }
    }
    const formObject = Object.fromEntries(formData.entries())
    const formResult = createItemTypeSchema.safeParse(formObject)
    if (!formResult.success) {
        const zodErrors = formResult.error.flatten()
        const messages = Object.values(zodErrors.fieldErrors).flat().join(', ')
        return {
            success: false,
            message: messages || 'Invalid input',
        }
    }
    const validData: CreateItemTypeSchemaType = formResult.data

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
  
    if (userError || !userData?.user?.id) {
        return {
            success: false,
            message: 'Authentication error',
        }
    }
  
    const { data: itemTypeData, error: supabaseItemTypeError } = await supabase
        .from('items_types')
        .insert({
            name: validData.type_name,
            catalog_id: catalogId,
        })
        .select()
        .single()

    if (supabaseItemTypeError || !itemTypeData) {
        return {
            success: false,
            message: 'Internal error, try later',
        }
    }
    
    return {
        success: true,
        message: 'Item type created successfully',
    }
}

/*
Server Action: Admin send order message.
*/
export async function adminSendOrderMessage(orderId: string, prevState: any, formData: unknown) {
    if (!(formData instanceof FormData)) {
        return {
            success: false,
            message: 'Invalid data format',
        }
    }

    const message = formData.get('message')
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return {
            success: false,
            message: 'Message is required',
        }
    }

    if (message.trim().length > 80) {
        return {
            success: false,
            message: 'Message must be 80 characters or less',
        }
    }

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
  
    if (userError || !userData?.user?.id) {
        return {
            success: false,
            message: 'Authentication error',
        }
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single()
    
    if (roleError || roleData?.role !== 'admin') {
        return {
            success: false,
            message: 'Not authorized',
        }
    }

    // Insert the message
    const { error: insertError } = await supabase
        .from('order_messages')
        .insert({
            message: message.trim(),
            order_id: orderId,
        })

    if (insertError) {
        return {
            success: false,
            message: 'Error sending message',
        }
    }

    return {
        success: true,
        message: 'Message sent successfully',
    }
}

/*
Server Action: Admin order validation.
*/
export async function adminValidateOrderReturn(orderId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Not authorized'
        }
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
    
    if (roleError || roleData?.role !== 'admin') {
        return {
            success: false,
            message: 'Not authorized',
        }
    }

    // Check if order exists and is already returned (status = true)
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status, validation')
        .eq('id', orderId)
        .single()

    if (orderError || !orderData) {
        return {
            success: false,
            message: 'Order not found',
        }
    }

    if (!orderData.status) {
        return {
            success: false,
            message: 'Order is not yet returned by the user',
        }
    }

    if (orderData.validation) {
        return {
            success: false,
            message: 'Order is already validated',
        }
    }

    // Get order items to increment stock
    const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId)

    if (orderItemsError) {
        return {
            success: false,
            message: 'Internal error, try later'
        }
    }

    // Increment stock for each item in the order
    for (const orderItem of orderItems) {
        const { data: currentItem, error: getItemError } = await supabase
            .from('items')
            .select('actual_quantity')
            .eq('id', orderItem.item_id)
            .single()

        if (getItemError || !currentItem) {
            return {
                success: false,
                message: 'Internal error, try later'
            }
        }

        const { error: updateStockError } = await supabase
            .from('items')
            .update({ 
                actual_quantity: currentItem.actual_quantity + orderItem.quantity
            })
            .eq('id', orderItem.item_id)

        if (updateStockError) {
            return {
                success: false,
                message: 'Error updating stock',
            }
        }
    }

    // Update the validation column
    const { error: updateError } = await supabase
        .from('orders')
        .update({ validation: true })
        .eq('id', orderId)

    if (updateError) {
        return {
            success: false,
            message: 'Error validating order',
        }
    }

    return {
        success: true,
        message: 'Order validated successfully',
    }
}
