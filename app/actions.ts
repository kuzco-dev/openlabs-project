import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginSchemaType = z.infer<typeof loginSchema>

export async function login(data: unknown) {
  try {
    // Check if data is FormData
    if (!(data instanceof FormData)) {
      return { 
        success: false, 
        message: 'Invalid data format' 
      }
    }

    // Convert FormData to object and validate
    const formObject = Object.fromEntries(data.entries())
    const formValid = loginSchema.safeParse(formObject)

    if (!formValid.success) {
      const zodErrors = formValid.error.flatten()
      return {
        success: false,
        message: zodErrors.fieldErrors,
      }
    }

    // Data is valid, proceed with login
    const validData: LoginSchemaType = formValid.data
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: validData.email,
      password: validData.password,
    })

    if (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      }
    }

    // Login successful
    revalidatePath('/', 'layout')
    redirect('/admin')

  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    }
  }
} 