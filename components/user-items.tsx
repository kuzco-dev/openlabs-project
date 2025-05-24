'use client'

import React, { useEffect, useState } from 'react'

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

  useEffect(() => {
    if (!catalogId) return

    setLoading(true)
    setError(null)

    fetch(`/api/user/items?catalog_id=${catalogId}`, {
      headers: {
        // Si tu as besoin de passer un token, tu peux l'ajouter ici
        // Authorization: `Bearer ${token}`,
      },
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
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [catalogId])

  if (loading) return <p>Chargement des items...</p>
  if (error) return <p>Erreur : {error}</p>
  if (items.length === 0) return <p>Aucun item trouvé pour ce catalogue.</p>

  return (
    <div>
      <h2>Items du catalogue</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: 12 }}>
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <p>
              Quantité par défaut : {item.default_quantity} — Quantité actuelle : {item.actual_quantity}
            </p>
            <small>Créé le : {new Date(item.created_at).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
