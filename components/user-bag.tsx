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

  const handleCheckout = async () => {
    setIsLoading(true)
    setMessage(null)
    
    const result = await createOrder(catalogId)
    
    setMessage(result.message)
    setIsLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Votre panier</h2>
        <p>Votre panier est vide</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Votre panier</h2>
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
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {message && (
        <div className={`mt-4 p-2 rounded ${message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          className="w-full" 
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? 'Création de la commande...' : 'Passer la commande'}
        </Button>
      </div>
    </div>
  )
}