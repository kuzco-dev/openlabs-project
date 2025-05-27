'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBag } from '@/lib/bag-context'

type Item = {
  id: string
  name: string
  description: string
  default_quantity: number
  actual_quantity: number
  created_at: string
  catalog_id: string
}

type UserItemsProps = {
  catalogId: string
}

export default function UserItems({ catalogId }: UserItemsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const { addItem, items: bagItems } = useBag()

  useEffect(() => {
    if (!catalogId) return

    setLoading(true)
    setError(null)

    fetch(`/api/user/items?catalog_id=${catalogId}`, {
      headers: {},
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Erreur inconnue')
        }
        return res.json()
      })
      .then((data: Item[]) => {
        setItems(data)
        // Initialize quantities with default values
        const initialQuantities = data.reduce((acc, item) => ({
          ...acc,
          [item.id]: Math.min(item.default_quantity, item.actual_quantity)
        }), {})
        setQuantities(initialQuantities)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [catalogId])

  const handleQuantityChange = (itemId: string, value: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const quantity = parseInt(value) || 0
    const maxQuantity = item.actual_quantity
    const bagQuantity = bagItems.find(i => i.id === itemId)?.quantity || 0
    const availableQuantity = maxQuantity - bagQuantity

    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.min(quantity, availableQuantity)
    }))
  }

  const handleAddToBag = (item: Item) => {
    const quantity = quantities[item.id] || 0
    const bagQuantity = bagItems.find(i => i.id === item.id)?.quantity || 0
    const availableQuantity = item.actual_quantity - bagQuantity

    if (quantity > 0 && quantity <= availableQuantity) {
      addItem({
        id: item.id,
        name: item.name,
        catalog_id: item.catalog_id
      }, quantity)
    }
  }

  if (loading) return <p>Chargement des items...</p>
  if (error) return <p>Erreur : {error}</p>
  if (items.length === 0) return <p>Aucun item trouvé pour ce catalogue.</p>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Items du catalogue</h2>
      <div className="grid gap-4">
        {items.map((item) => {
          const bagQuantity = bagItems.find(i => i.id === item.id)?.quantity || 0
          const availableQuantity = item.actual_quantity - bagQuantity

          return (
            <div key={item.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <div className="text-sm text-gray-600">
                    Quantité disponible : {availableQuantity}
                    {bagQuantity > 0 && (
                      <span className="ml-2 text-blue-600">
                        (Déjà {bagQuantity} dans le panier)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={availableQuantity}
                    value={quantities[item.id] || 0}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-20"
                  />
                  <Button
                    onClick={() => handleAddToBag(item)}
                    disabled={!quantities[item.id] || quantities[item.id] <= 0 || quantities[item.id] > availableQuantity}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
