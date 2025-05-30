'use client'

import { useActionState } from 'react'
import { adminCreateItem } from '@/utils/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const initialState = {
  success: true,
  message: '',
}

interface AdminItemFormProps {
  catalogId: string
  onSuccess?: () => void
}

const AdminItemForm = ({ catalogId, onSuccess }: AdminItemFormProps) => {
  const createItemWithCatalogId = adminCreateItem.bind(null, catalogId)
  const [state, formAction, pending] = useActionState(createItemWithCatalogId, initialState)

  const handleSubmit = async (formData: FormData) => {
    //const result = await formAction(formData)
    if (state.success && onSuccess) {
      onSuccess()
    }
  }

  return (
    <form className="p-4 flex flex-col gap-2 w-200" action={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="item_name">Name</Label>
        <Input id="item_name" name="item_name" type="text" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_description">Description</Label>
        <Input id="item_description" name="item_description" type="text" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_quantity">Quantity</Label>
        <Input id="item_quantity" name="item_quantity" type="number" min={1} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item_image">Image (JPEG only)</Label>
        <Input 
          id="item_image" 
          name="item_image" 
          type="file" 
          accept="image/jpeg"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Item'}
      </Button>
      <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
        {state.message}
      </p>
    </form>
  )
}

export default AdminItemForm