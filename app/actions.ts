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
    redirect('/admin')

  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    }
  }
}

// Signup validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: 'Role must be either admin or user' }),
  }),
})

export type SignupSchemaType = z.infer<typeof signupSchema>

export async function signup(data: unknown) {
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
    const formValid = signupSchema.safeParse(formObject)

    if (!formValid.success) {
      const zodErrors = formValid.error.flatten()
      return {
        success: false,
        message: zodErrors.fieldErrors,
      }
    }

    // Data is valid, proceed with signup
    const validData: SignupSchemaType = formValid.data
    const supabase = await createClient()

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: validData.email,
      password: validData.password,
    })

    if (error) {
      return { 
        success: false, 
        message: error.message || 'Signup failed' 
      }
    }

    // Insert role into roles table
    const { error: insertError } = await supabase
      .from('roles')
      .insert({
        user_id: signUpData?.user?.id,
        role: validData.role,
      })

    if (insertError) {
      return {
        success: false,
        message: insertError.message || 'Failed to assign role'
      }
    }

    // Signup successful
    redirect('/admin')

  } catch (error) {
    console.error('Unexpected error:', error)
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    }
  }
} 