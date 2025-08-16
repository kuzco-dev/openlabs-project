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
  item_name: z.string().max(30, 'Name must be at most 30 characters'),
  item_description: z.string().max(60, 'Description must be at most 60 characters'),
  item_quantity: z.coerce.number().min(1, 'Minimum quantity is 1').max(1000, 'Maximum quantity is 1000'),
  item_image: z.instanceof(File).refine((file) => file.type === 'image/jpeg', {
    message: 'Only JPEG images are allowed'
  }).optional(),
  serial_number: z.string().max(30, 'Serial number must be at most 30 characters').optional(),
  item_type_id: z.string().optional(),
})

export type CreateItemSchemaType = z.infer<typeof createItemSchema>

// Catalog Schema
export const createCatalogSchema = z.object({
  name: z.string().max(30, 'Name must be at most 30 characters'),
  description: z.string().max(120, 'Description must be at most 120 characters'),
  acronym: z.string().max(10, 'Acronym must be at most 10 characters'),
})

export type CreateCatalogSchemaType = z.infer<typeof createCatalogSchema>

// Institution Schema
export const createInstitutionSchema = z.object({
    name: z.string().max(100, 'Name must be at most 100 characters'),
    description: z.string().max(120, 'Description must be at most 120 characters'),
    acronym: z.string().max(10, 'Acronym must be at most 10 characters'),
})

export type CreateInstitutionSchemaType = z.infer<typeof createInstitutionSchema>

// Item Type Schema
export const createItemTypeSchema = z.object({
    type_name: z.string().max(50, 'Type name must be at most 50 characters'),
})

export type CreateItemTypeSchemaType = z.infer<typeof createItemTypeSchema>