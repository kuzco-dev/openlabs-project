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
import { Button } from "./ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Package, ArrowUpDown, Check, ChevronsUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface OrderItem {
  name: string
  description: string
  quantity: number
}

interface Order {
  id: string
  status: boolean
  end_date: string
  creation_date: string
  catalog_id: string
  user_id: string
  n_items: number
  user_email: string
  items: OrderItem[]
}

type StatusFilter = 'all' | 'completed' | 'in_progress'
type SortOrder = 'asc' | 'desc'
type SortField = 'creation_date' | 'end_date'

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('creation_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [openEmail, setOpenEmail] = useState(false)
  const [openItem, setOpenItem] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/admin/orders?catalog=${catalogId}`)
        if (!res.ok) throw new Error("Erreur lors du chargement des commandes.")
        const data = await res.json()
        setOrders(data)
        } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unexpected error occurred.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [catalogId])

  // Get unique emails from orders
  const uniqueEmails = Array.from(new Set(orders.map(order => order.user_email))).sort()

  // Get unique items from orders
  const uniqueItems = Array.from(
    new Set(
      orders.flatMap(order => 
        order.items.map(item => item.name)
      )
    )
  ).sort()

  const filteredOrders = orders.filter(order => {
    // First filter by status
    const statusMatch = statusFilter === 'all' 
      ? true 
      : statusFilter === 'completed' 
        ? order.status 
        : !order.status

    // Then filter by email if one is selected
    const emailMatch = selectedEmail ? order.user_email === selectedEmail : true

    // Then filter by item if one is selected
    const itemMatch = selectedItem 
      ? order.items.some(item => item.name === selectedItem)
      : true

    return statusMatch && emailMatch && itemMatch
  })

  const sortedAndFilteredOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a[sortField] || 0).getTime()
    const dateB = new Date(b[sortField] || 0).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  if (loading) return <p>Loading orders...</p>
  if (error) return <p className="text-red-500">Error : {error}</p>

  return (
    <div className="p-2">
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="completed">Returned</SelectItem>
              <SelectItem value="in_progress">Loan in progress</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={openEmail} onOpenChange={setOpenEmail}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openEmail}
                className="w-[250px] justify-between"
              >
                {selectedEmail || "Select email..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search email..." />
                <CommandEmpty>No email found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedEmail(null)
                      setOpenEmail(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedEmail ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All emails
                  </CommandItem>
                  {uniqueEmails.map((email) => (
                    <CommandItem
                      key={email}
                      onSelect={() => {
                        setSelectedEmail(email)
                        setOpenEmail(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmail === email ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={openItem} onOpenChange={setOpenItem}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openItem}
                className="w-[200px] justify-between"
              >
                {selectedItem || "Select item..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search item..." />
                <CommandEmpty>No item found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedItem(null)
                      setOpenItem(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedItem ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All items
                  </CommandItem>
                  {uniqueItems.map((item) => (
                    <CommandItem
                      key={item}
                      onSelect={() => {
                        setSelectedItem(item)
                        setOpenItem(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedItem === item ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => toggleSort('creation_date')}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            {sortField === 'creation_date' 
              ? (sortOrder === 'asc' ? 'Oldest first' : 'Newest first')
              : 'Creation date'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => toggleSort('end_date')}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            {sortField === 'end_date'
              ? (sortOrder === 'asc' ? 'Earliest end' : 'Latest end')
              : 'End date'}
          </Button>
        </div>
      </div>
      <Table>
        <TableCaption>List of recent orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Order ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Creation date</TableHead>
            <TableHead>End date</TableHead>
            <TableHead>Total items</TableHead>
            <TableHead>User email</TableHead>
            <TableHead>Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndFilteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.status ? "Returned" : "Loan in progress"}</TableCell>
              <TableCell>{new Date(order.creation_date).toLocaleString()}</TableCell>
              <TableCell>{order.end_date ? new Date(order.end_date).toLocaleString() : "—"}</TableCell>
              <TableCell>{order.n_items}</TableCell>
              <TableCell>{order.user_email}</TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Package className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Order Items</h3>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="border-b pb-2">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                            <p className="text-sm">Quantity: {item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total</TableCell>
            <TableCell>{sortedAndFilteredOrders.length} order(s)</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="hidden">{institutionId}</div>
    </div>
  )
}
