'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useActionState } from 'react'
import { userAddInstitutions } from '@/utils/actions'

const initialState = {
  success: true,
  message: '',
}

type Institution = {
  id: string
  name: string
  acronym: string
}

export default function UserInstitutionsForm() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [state, formAction, pending] = useActionState(userAddInstitutions, initialState)

  // Fetch institutions
  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const res = await fetch('/api/user/institutions')
        const data = await res.json()
        setInstitutions(data)
        console.log(institutions)
      } catch (err) {
        console.error('Failed to fetch institutions:', err)
      }
    }
    fetchInstitutions()
  }, [])

  // Update checkbox state
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: checked }))
  }

  const handleSubmit = async () => {
    const selectedIds = Object.entries(selected)
      .filter(([, isChecked]) => isChecked)
      .map(([id]) => id)
  
    const formData = new FormData()
    formData.append('institutions', JSON.stringify(selectedIds))
    await formAction(formData)
  }

  return (
    <form className="flex flex-col gap-6 max-w-md" action={handleSubmit}>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Select your institutions</h2>
        {institutions.length === 0 && <p className="text-muted-foreground text-sm">Loading institutions...</p>}
        {institutions.map((institution) => (
          <div key={institution.id} className="flex items-center gap-2">
            <Checkbox
              id={institution.id}
              checked={!!selected[institution.id]}
              onCheckedChange={(checked) => handleCheckboxChange(institution.id, !!checked)}
            />
            <Label htmlFor={institution.id}>{institution.name}</Label>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Save Institutions'}
      </Button>
      <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>
        {state.message}
      </p>
    </form>
  )
}
