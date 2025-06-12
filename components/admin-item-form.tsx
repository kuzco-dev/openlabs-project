'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { adminCreateItem } from '@/utils/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { z } from 'zod'

const initialState = {
  success: true,
  message: '',
}

interface AdminItemFormProps {
  catalogId: string
  onSuccess?: () => void
}

// Schéma de validation
const itemSchema = z.object({
  item_name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  item_description: z.string().min(1, "Description is required").max(500, "Description is too long"),
  item_quantity: z.string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1, "Quantity must be at least 1")),
  item_image: z.instanceof(File).optional(),
})

type FormErrors = {
  item_name?: string
  item_description?: string
  item_quantity?: string
  item_image?: string
}

const AdminItemForm = ({ catalogId, onSuccess }: AdminItemFormProps) => {
  const createItemWithCatalogId = adminCreateItem.bind(null, catalogId)
  const [state, formAction, pending] = useActionState(createItemWithCatalogId, initialState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData | null>(null)
  const [isPending, startTransition] = useTransition()
  console.log(formData, )

  // Optional callback on success
  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess()
      // Reset form
      setErrors({})
      setFormData(null)
    }
  }, [state, onSuccess])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      // Validate form data
      const validatedData = itemSchema.parse({
        item_name: formData.get('item_name'),
        item_description: formData.get('item_description'),
        item_quantity: formData.get('item_quantity'),
        item_image: formData.get('item_image'),
      })
      console.log(validatedData)

      // If validation passes, submit the form
      setFormData(formData)
      startTransition(() => {
        formAction(formData)
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors
          newErrors[field] = err.message
        })
        setErrors(newErrors)
      }
    }
  }

  return (
    <form className="p-4 flex flex-col gap-2 w-200" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="item_name">Name (max 30 characters)</Label>
        <Input 
          id="item_name" 
          name="item_name" 
          type="text" 
          required 
          className={errors.item_name ? "border-red-500" : ""}
        />
        {errors.item_name && (
          <p className="text-sm text-red-500">{errors.item_name}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_description">Description (max 60 characters)</Label>
        <Input 
          id="item_description" 
          name="item_description" 
          type="text" 
          required 
          className={errors.item_description ? "border-red-500" : ""}
        />
        {errors.item_description && (
          <p className="text-sm text-red-500">{errors.item_description}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_quantity">Quantity (max 1000)</Label>
        <Input 
          id="item_quantity" 
          name="item_quantity" 
          type="number" 
          min={1} 
          required 
          className={errors.item_quantity ? "border-red-500" : ""}
        />
        {errors.item_quantity && (
          <p className="text-sm text-red-500">{errors.item_quantity}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_image">Image (JPG only)</Label>
        <Input 
          id="item_image" 
          name="item_image" 
          type="file" 
          accept="image/jpeg"
          className={errors.item_image ? "border-red-500" : ""}
        />
        {errors.item_image && (
          <p className="text-sm text-red-500">{errors.item_image}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending || pending}>
        {isPending || pending ? 'Creating...' : 'Create Item'}
      </Button>
      <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
        {state.message}
      </p>
    </form>
  )
}

export default AdminItemForm
