'use client'

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Order {
  id: string
  status: boolean
  end_date: string
  creation_date: string
  catalog_id: string
  user_id: string
  n_items: number
}

export default function AdminOrders({
  institutionId,
  catalogId,
}: {
  institutionId: string
  catalogId: string
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/admin/orders?catalog=${catalogId}`)
        if (!res.ok) throw new Error("Erreur lors du chargement des commandes.")
        const data = await res.json()
        setOrders(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [catalogId])

  if (loading) return <p>Chargement des commandes...</p>
  if (error) return <p className="text-red-500">Erreur : {error}</p>

  return (
    <div className="p-2">
      <Table>
        <TableCaption>Liste des commandes récentes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Commande ID</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créée le</TableHead>
            <TableHead>Clôturée le</TableHead>
            <TableHead>Total items </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.status ? "Terminée" : "En cours"}</TableCell>
              <TableCell>{new Date(order.creation_date).toLocaleString()}</TableCell>
              <TableCell>{order.end_date ? new Date(order.end_date).toLocaleString() : "—"}</TableCell>
              <TableCell>{order.n_items}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell>{orders.length} commande(s)</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
