// utils/schemas.ts
import { z } from 'zod'

// Login Schema
export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})
export type LoginSchemaType = z.infer<typeof loginSchema>

// Signup Schema
export const signupSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'user'], {
        errorMap: () => ({ message: 'Role must be either admin or student'}),
    }),
})
export type SignupSchemaType = z.infer<typeof signupSchema>

// Item Schema
export const createItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  item_description: z.string().min(1, 'Description is required'),
  item_quantity: z
    .string()
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Quantity must be a positive number',
    }),
})

export type CreateItemSchemaType = z.infer<typeof createItemSchema>