
'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Login Zod Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
export type LoginSchemaType = z.infer<typeof loginSchema>

// Signup Zod Schema
const signupSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'user'], {
        errorMap: () => ({ message: 'Role must be either admin or student'}),
    }),
})
export type SignupSchemaType = z.infer<typeof signupSchema>

/*
Server Action: login form submission.
    - Validates FormData using Zod schema
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
        console.log(zodErrors);
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
    - Validates FormData using Zod schema
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