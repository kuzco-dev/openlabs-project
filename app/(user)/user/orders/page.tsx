'use client'

import { useEffect, useState } from 'react'
import { userUpdateOrderReturnDate, userFinalizeOrder } from '@/utils/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OrderItem {
    quantity: number
    item: {
        name: string
        description: string
    }
}

interface Order {
    id: string
    status: boolean
    created_at: string
    end_date: string | null
    catalog: {
        name: string
        acronym: string
    }
    order_items: OrderItem[]
}

export default function Page() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
    const [returnDate, setReturnDate] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [finalizingOrderId, setFinalizingOrderId] = useState<string | null>(null)

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

    const sortOrders = (orders: Order[]) => {
        return orders.sort((a: Order, b: Order) => {
            if (a.status !== b.status) {
                return a.status ? 1 : -1; // false (en cours) en premier
            }
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
        });
    }

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/user/orders')
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des commandes')
                }
                const data = await response.json()
                setOrders(sortOrders(data))
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue')
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    const handleUpdateReturnDate = async (orderId: string) => {
        if (!validateDate(returnDate)) {
            setMessage({ type: 'error', text: 'Return date cannot be earlier than today' })
            return
        }

        setMessage(null)
        const result = await userUpdateOrderReturnDate(orderId, returnDate)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            setEditingOrderId(null)
            // Rafraîchir les données et appliquer le tri
            const response = await fetch('/api/user/orders')
            const data = await response.json()
            setOrders(sortOrders(data))
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    const handleFinalizeOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to complete this order? This action is irreversible.')) {
            return
        }

        setFinalizingOrderId(orderId)
        setMessage(null)
        
        const result = await userFinalizeOrder(orderId)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            // Rafraîchir les données et appliquer le tri
            const response = await fetch('/api/user/orders')
            const data = await response.json()
            setOrders(sortOrders(data))
        } else {
            setMessage({ type: 'error', text: result.message })
        }
        
        setFinalizingOrderId(null)
    }

    const startEditing = (order: Order) => {
        setEditingOrderId(order.id)
        setReturnDate(order.end_date || '')
    }

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center p-8 text-gray-500">
                    You have no orders yet
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            {message && (
                <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">My orders</h2>
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">
                                    Order of the {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Catalog : {order.catalog.name} ({order.catalog.acronym})
                                    </p>
                                    {order.end_date && !editingOrderId && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-600">
                                                End date : {new Date(order.end_date).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            {!order.status && new Date(order.end_date) < new Date() && (
                                                <p className="text-sm text-red-600 font-medium">
                                                    The deadline has passed, return the items
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-3 py-1 rounded-full text-sm ${
                                        order.status 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {order.status ? 'Loan completed' : 'Loan in progress'}
                                    </div>
                                    {!order.status && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEditing(order)}
                                            >
                                                {order.end_date ? 'Change the date' : 'Set return date'}
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleFinalizeOrder(order.id)}
                                                disabled={finalizingOrderId === order.id}
                                            >
                                                {finalizingOrderId === order.id ? 'Return...' : 'Return items'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {editingOrderId === order.id && (
                                <div className="border-t pt-4">
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="date"
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            min={getMinDate()}
                                        />
                                        <Button
                                            onClick={() => handleUpdateReturnDate(order.id)}
                                            disabled={!returnDate}
                                        >
                                            Validate
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditingOrderId(null)
                                                setReturnDate('')
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Items ordered :</h4>
                                <div className="space-y-2">
                                    {order.order_items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <div>
                                                <span className="font-medium">{item.item.name}</span>
                                                <p className="text-gray-600">{item.item.description}</p>
                                            </div>
                                            <span className="text-gray-700">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
  