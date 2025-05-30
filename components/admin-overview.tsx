'use client'

import { useEffect, useState } from "react"

interface AdminOverviewProps {
  institutionId: string
  catalogId: string
}

export default function AdminOverview({ institutionId, catalogId }: AdminOverviewProps) {
  const [stats, setStats] = useState<{ total_orders: number; total_items: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!institutionId || !catalogId) return

    const fetchStats = async () => {
      try {
        const res = await fetch(
          `/api/admin/overview?institution=${institutionId}&catalog=${catalogId}`
        )

        if (!res.ok) {
          throw new Error(`Error API: ${res.status}`)
        }

        const data = await res.json()
        setStats(data)
        } catch (err) {
        console.error(err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unexpected error occurred.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [institutionId, catalogId])

  if (loading) return <p>Loading overview...</p>
  if (error) return <p>Error : {error}</p>

  return (
    <div>
      <h2>Overview for Catalog: {catalogId}</h2>
      <p>Institution ID: {institutionId}</p>
      <p>Total Orders: {stats?.total_orders}</p>
      <p>Total Items: {stats?.total_items}</p>
    </div>
  )
}
