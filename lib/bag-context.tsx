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
  returnDate: string
  addItem: (item: Omit<BagItem, 'quantity'>, quantity: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setReturnDate: (date: string) => void
  createOrder: (catalogId: string) => Promise<{ success: boolean; message: string }>
  clearBag: () => void
}

const BagContext = createContext<BagContextType | undefined>(undefined)

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([])
  const [returnDate, setReturnDate] = useState<string>('')

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
        item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    )
  }

  const clearBag = () => {
    setItems([])
    setReturnDate('')
  }

  const createOrder = async (catalogId: string) => {
    if (items.length === 0) {
      return { success: false, message: 'Le panier est vide' }
    }

    if (!returnDate) {
      return { success: false, message: 'Please select a return date' }
    }

    const orderItems = items.map(item => ({
      item_id: item.id,
      quantity: item.quantity
    }))
    
    const result = await userCreateOrder(catalogId, orderItems, returnDate)
    
    if (result.success) {
      setItems([]) // Clear the bag after successful order
      setReturnDate('') // Clear the return date after successful order
    }
    
    return result
  }

  return (
    <BagContext.Provider value={{ 
      items, 
      returnDate, 
      addItem, 
      removeItem, 
      updateQuantity, 
      setReturnDate, 
      createOrder, 
      clearBag 
    }}>
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