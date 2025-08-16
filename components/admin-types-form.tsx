'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { adminCreateItemType } from '@/utils/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { z } from 'zod'

const initialState = {
  success: true,
  message: '',
}

interface AdminTypesFormProps {
  catalogId: string
  onSuccess?: () => void
}

// Schéma de validation
const typeSchema = z.object({
  type_name: z.string().min(1, "Type name is required").max(50, "Type name is too long"),
})

type FormErrors = {
  type_name?: string
}

const AdminTypesForm = ({ catalogId, onSuccess }: AdminTypesFormProps) => {
  const createTypeWithCatalogId = adminCreateItemType.bind(null, catalogId)
  const [state, formAction, pending] = useActionState(createTypeWithCatalogId, initialState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess()
      setErrors({})
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const form = e.currentTarget
    const formDataObj = new FormData(form)

    try {
      // Validate form data
      // eslint-disable-line react-hooks/exhaustive-deps
      const validatedData = typeSchema.parse({
        type_name: formDataObj.get('type_name'),
      })

      // If validation passes, submit the form
      startTransition(() => {
        formAction(formDataObj)
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
        <Label htmlFor="type_name">Type Name (max 50 characters)</Label>
        <Input 
          id="type_name" 
          name="type_name" 
          type="text" 
          required 
          className={errors.type_name ? "border-red-500" : ""}
        />
        {errors.type_name && (
          <p className="text-sm text-red-500">{errors.type_name}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending || pending}>
        {isPending || pending ? 'Creating...' : 'Create Type'}
      </Button>
      <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
        {state.message}
      </p>
    </form>
  )
}

export default AdminTypesForm 