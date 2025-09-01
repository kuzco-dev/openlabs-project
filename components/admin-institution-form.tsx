'use client'

import { useActionState, useEffect } from 'react'
import { adminCreateInstitution } from '@/utils/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const initialState = {
    success: true,
    message: '',
}

interface AdminInstitutionFormProps {
  onSuccess?: () => void
}

const AdminInstitutionForm = ({ onSuccess }: AdminInstitutionFormProps) => {
  const [state, formAction, pending] = useActionState(adminCreateInstitution, initialState)

  useEffect(() => {
    if (state.success && state.message && onSuccess) {
      onSuccess()
    }
  }, [state.success, state.message, onSuccess])

  return (
    <form className="flex flex-col gap-1 max-w-md" action={formAction}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name (max 30 characters)</Label>
        <Input id="name" name="name" type="text" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (max 120 characters)</Label>
        <Input id="description" name="description" type="text" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="acronym">Acronym (max 10 characters)</Label>
        <Input id="acronym" name="acronym" type="text" required />
      </div>
      <div>
        <Button type="submit" disabled={pending} className='w-full mt-2 cursor-pointer'>
            {pending ? 'Creating...' : 'Create Item'}
        </Button>
      </div>
      <div>
      <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
        {state.message}
      </p>
      </div>
      
    </form>
  )
}

export default AdminInstitutionForm