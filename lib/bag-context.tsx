'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { userCreateOrder } from '@/utils/actions'

type BagItem = {
  id: string
  name: string
  quantity: number
  catalog_id: string
}

type BagContextType = {
  items: BagItem[]
  addItem: (item: Omit<BagItem, 'quantity'>, quantity: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  createOrder: (catalogId: string, returnDate: string) => Promise<{ success: boolean; message: string }>
  clearBag: () => void
}

const BagContext = createContext<BagContextType | undefined>(undefined)

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([])

  const addItem = (item: Omit<BagItem, 'quantity'>, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.id === item.id)
      if (existingItem) {
        return currentItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...currentItems, { ...item, quantity }]
    })
  }
  
  const removeItem = (itemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearBag = () => {
    setItems([])
  }

  const createOrder = async (catalogId: string, returnDate: string) => {
    if (items.length === 0) {
      return { success: false, message: 'Le panier est vide' }
    }

    const orderItems = items.map(item => ({
      item_id: item.id,
      quantity: item.quantity
    }))
    
    const result = await userCreateOrder(catalogId, orderItems, returnDate)
    
    if (result.success) {
      setItems([]) // Clear the bag after successful order
    }
    
    return result
  }

  return (
    <BagContext.Provider value={{ items, addItem, removeItem, updateQuantity, createOrder, clearBag }}>
      {children}
    </BagContext.Provider>
  )
}

export function useBag() {
  const context = useContext(BagContext)
  if (context === undefined) {
    throw new Error('useBag must be used within a BagProvider')
  }
  return context
} 