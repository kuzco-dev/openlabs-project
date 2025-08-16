'use client'

import { useBag } from '@/lib/bag-context'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'

type UserBagProps = {
  catalogId: string
}

export default function UserBag({ catalogId }: UserBagProps) {
  const { items, removeItem, updateQuantity, createOrder } = useBag()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState('')

  // Fonction pour obtenir la date minimale (aujourd'hui)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Fonction pour valider la date
  const validateDate = (date: string) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Réinitialiser l'heure à minuit pour la comparaison
    return selectedDate >= today
  }

  const handleCheckout = async () => {
    if (!returnDate) {
      setMessage('Please select a return date')
      return
    }

    if (!validateDate(returnDate)) {
      setMessage('Return date cannot be earlier than today')
      return
    }

    setIsLoading(true)
    setMessage(null)
    
    const result = await createOrder(catalogId, returnDate)
    
    setMessage(result.message)
    setIsLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="p-0">
        <h2 className="text-2xl font-bold mb-4">Your bag</h2>
        <p>Your bag is empty</p>
      </div>
    )
  }

  return (
    <div className="p-0">
      <h2 className="text-2xl font-bold mb-4">Your bag</h2>
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value) || 0
                    updateQuantity(item.id, quantity)
                  }}
                  className="w-20"
                />
                <Button
                  variant="destructive"
                  onClick={() => removeItem(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            End date
          </label>
          <Input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={getMinDate()}
            className="w-full"
          />
        </div>

        {message && (
          <div className={`p-2 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        
        <Button 
          className="w-full" 
          onClick={handleCheckout}
          disabled={isLoading || !returnDate}
        >
          {isLoading ? 'Creating the order...' : 'Place the order'}
        </Button>
      </div>
    </div>
  )
}