'use client'

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBag } from '@/lib/bag-context'
import Image from 'next/image'
import { Search } from 'lucide-react'

type Item = {
  id: string
  name: string
  description: string
  default_quantity: number
  actual_quantity: number
  created_at: string
  catalog_id: string
  image_url: string
}

type UserItemsProps = {
  catalogId: string
}

export default function UserItems({ catalogId }: UserItemsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
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
          throw new Error(err.error || 'Unknown error')
        }
        return res.json()
      })
      .then((data: Item[]) => {
        setItems(data)
        setFilteredItems(data)
        // Initialize quantities with default values
        const initialQuantities = data.reduce((acc, item) => ({
          ...acc,
          [item.id]: 0
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

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [searchQuery, items])

  const handleQuantityChange = (itemId: string, value: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // Si la valeur est vide, mettre à 0
    if (value === '') {
      setQuantities(prev => ({
        ...prev,
        [itemId]: 0
      }))
      return
    }

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

  const handleImageError = (itemId: string) => {
    setFailedImages(prev => new Set([...prev, itemId]))
  }

  if (loading) return <p>Loading items...</p>
  if (error) return <p>Error : {error}</p>
  if (items.length === 0) return <p>No items found for this catalog.</p>

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search for an item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500">No items match your search</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const bagQuantity = bagItems.find(i => i.id === item.id)?.quantity || 0
            const availableQuantity = item.actual_quantity - bagQuantity
            const hasImageFailed = failedImages.has(item.id)

            return (
              <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col">
                <div className="relative w-full aspect-square bg-gray-100">
                  {!hasImageFailed ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Pas d&apos;image
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                  <div className="text-sm text-gray-600 mb-4">
                    Quantity available : {availableQuantity}
                    {bagQuantity > 0 && (
                      <span className="ml-2 text-blue-600">
                        (Already {bagQuantity} in cart)
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        type="number"
                        min="0"
                        max={availableQuantity}
                        value={quantities[item.id] || ''}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20"
                      />
                      <Button
                        onClick={() => handleAddToBag(item)}
                        disabled={!quantities[item.id] || quantities[item.id] <= 0 || quantities[item.id] > availableQuantity}
                        className='cursor-pointer flex-grow'
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
