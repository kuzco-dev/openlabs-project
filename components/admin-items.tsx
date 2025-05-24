'use client'
import { useEffect, useState } from "react"

interface Item {
  id: string
  name: string
  description: string
  quantity: number
  created_at: string
  catalog_id: string
}

export default function AdminItems({
  institutionId,
  catalogId
}: {
  institutionId: string
  catalogId: string
}) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!catalogId) return

    fetch(`/api/admin/items?catalog=${catalogId}`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to fetch items:', err))
  }, [catalogId])

  return (
    <div>
      <h2>Items for Catalog: {catalogId}</h2>
      <p>Institution ID: {institutionId}</p>

      <ul className="mt-4 space-y-2">
        {items.length === 0 ? (
          <li>No items found.</li>
        ) : (
          items.map(item => (
            <li key={item.id} className="border p-3 rounded-md shadow">
              <strong>{item.name}</strong> — {item.description}  
              <div>Quantity: {item.quantity}</div>
              <div className="text-sm text-gray-500">Created at: {new Date(item.created_at).toLocaleString()}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
