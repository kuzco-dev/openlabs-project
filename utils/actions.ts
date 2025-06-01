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
    CreateInstitutionSchemaType
} from './schemas'

import { revalidatePath } from 'next/cache'

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
        user_id: supabaseSignupData?.user?.id,
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
  
    // Create the item first to get its ID
    const { data: itemData, error: supabaseItemsError } = await supabase
      .from('items')
      .insert({
        name: validData.item_name,
        description: validData.item_description,
        default_quantity: Number(validData.item_quantity),
        actual_quantity: Number(validData.item_quantity),
        catalog_id: catalogId,
      })
      .select()
      .single()

    if (supabaseItemsError || !itemData) {
      return {
        success: false,
        message: 'Internal error, try later',
      }
    }

    // If there's an image, upload it
    if (validData.item_image) {
      const imageFile = validData.item_image
      const { error: uploadError } = await supabase
        .storage
        .from('items')
        .upload(`${itemData.id}.jpg`, imageFile, {
          cacheControl: '3600',
          upsert: false
        })
        console.log(uploadError)

      if (uploadError) {
        // If image upload fails, delete the item
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

export async function userCreateOrder(catalogId: string, items: OrderItem[], returnDate: string) {
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
      user_id: user.id,
      end_date: returnDate
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

/*
Server Action: admin catalog creation.
    - Validates form using Zod schema
    - Creates catalog in Supabase
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
        message: "Unauthenticated user"
        }
    }

    // Data check
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

    // Insert data
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

    return {
        success: true,
        message: 'Catalog created successfully',
    }
}

export async function adminCreateInstitution(prevState: any, data: unknown){

    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    // Data check
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
        message: 'Catalog created successfully',
    }
}

export async function adminModifyInstitution(institutionId: string, prevState: any, data: unknown) {
    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    // Data check
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

    // Update data
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

export async function adminModifyCatalog(catalogId: string, prevState: any, data: unknown) {
    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    // Data check
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

export async function adminDeleteCatalog(catalogId: string) {
    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    // Delete the catalog
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

export async function adminDeleteInstitution(institutionId: string) {
    // Authentification check
    const supabase = await createClient()
    const { data: supabaseUserData, error: supabaseUserError } = await supabase.auth.getUser()
    if (supabaseUserError || !supabaseUserData) {
        return {
            success: false,
            message: "Unauthenticated user"
        }
    }

    // Delete the institution
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

export async function userUpdateOrderReturnDate(orderId: string, returnDate: string) {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Utilisateur non authentifié'
        }
    }

    // Vérifier que la commande appartient bien à l'utilisateur
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('user_id, status')
        .eq('id', orderId)
        .single()

    if (orderError || !order || order.user_id !== user.id) {
        return {
            success: false,
            message: 'Commande non trouvée ou non autorisée'
        }
    }

    // Vérifier que la commande n'est pas terminée
    if (order.status) {
        return {
            success: false,
            message: 'Impossible de modifier une commande terminée'
        }
    }

    // Mettre à jour la date de retour
    const { error: updateError } = await supabase
        .from('orders')
        .update({ end_date: returnDate })
        .eq('id', orderId)

    if (updateError) {
        return {
            success: false,
            message: 'Erreur lors de la mise à jour de la date de retour'
        }
    }

    return {
        success: true,
        message: 'Date de retour mise à jour avec succès'
    }
}

export async function userFinalizeOrder(orderId: string) {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return {
            success: false,
            message: 'Utilisateur non authentifié'
        }
    }

    // Vérifier que la commande appartient bien à l'utilisateur
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('user_id, status')
        .eq('id', orderId)
        .single()

    if (orderError || !order || order.user_id !== user.id) {
        return {
            success: false,
            message: 'Commande non trouvée ou non autorisée'
        }
    }

    // Vérifier que la commande n'est pas déjà terminée
    if (order.status) {
        return {
            success: false,
            message: 'La commande est déjà terminée'
        }
    }

    // Récupérer les items de la commande avec leurs quantités
    const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId)

    if (orderItemsError) {
        return {
            success: false,
            message: 'Erreur lors de la récupération des items de la commande'
        }
    }

    // Mettre à jour les quantités disponibles pour chaque item
    for (const orderItem of orderItems) {
        // D'abord récupérer la quantité actuelle
        const { data: currentItem, error: getItemError } = await supabase
            .from('items')
            .select('actual_quantity')
            .eq('id', orderItem.item_id)
            .single()

        if (getItemError || !currentItem) {
            return {
                success: false,
                message: 'Erreur lors de la récupération des quantités actuelles'
            }
        }

        // Mettre à jour avec la nouvelle quantité
        const { error: updateError } = await supabase
            .from('items')
            .update({ 
                actual_quantity: currentItem.actual_quantity + orderItem.quantity
            })
            .eq('id', orderItem.item_id)

        if (updateError) {
            return {
                success: false,
                message: 'Erreur lors de la mise à jour des quantités'
            }
        }
    }

    // Mettre à jour le statut de la commande
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: true })
        .eq('id', orderId)

    if (updateError) {
        return {
            success: false,
            message: 'Erreur lors de la finalisation de la commande'
        }
    }

    return {
        success: true,
        message: 'Commande finalisée avec succès'
    }
}