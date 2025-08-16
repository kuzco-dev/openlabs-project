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
import { Package, ArrowUpDown, Check, ChevronsUpDown, MessageSquare, CheckCircle, CheckSquare } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { adminSendOrderMessage, adminValidateOrderReturn } from "@/utils/actions"
import { useActionState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OrderItem {
  name: string
  serial_number?: string | null
  item_type?: string | null
  quantity: number
}

interface Order {
  id: string
  status: boolean
  end_date: string
  creation_date: string
  catalog_id: string
  user_id: string
  validation: boolean | null
  n_items: number
  user_email: string
  items: OrderItem[]
}

interface OrderMessage {
  id: string
  message: string
  created_at: string
}

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'delay'
type SortOrder = 'asc' | 'desc'
type SortField = 'creation_date' | 'end_date'

function MessageForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(adminSendOrderMessage.bind(null, orderId), {
    success: false,
    message: '',
  })
  const [messages, setMessages] = useState<OrderMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/order/message?orderId=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [orderId])

  const handleSubmit = async (formData: FormData) => {
    await formAction(formData)
  }

  // Watch for state changes and refresh messages when successful
  useEffect(() => {
    if (state.success) {
      fetchMessages()
      // Clear the form
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.reset()
      }
      
      // Show success message
      setShowSuccess(true)
      
      // Clear success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [state.success])

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Message (max 80 characters)</Label>
          <Input
            id="message"
            name="message"
            placeholder="Enter your message..."
            maxLength={80}
            required
          />
        </div>
        
        <Button type="submit" className="w-full">
          Send Message
        </Button>
      </form>

      {state.message && !state.success && (
        <p className="text-sm text-red-600">
          {state.message}
        </p>
      )}
      
      {showSuccess && (
        <p className="text-sm text-green-600">
          Message sent successfully!
        </p>
      )}

      <div className="space-y-2">
        <Label>Message History</Label>
        <ScrollArea className="h-32 w-full border rounded-md p-2">
          {loading ? (
            <p className="text-sm text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="border-b pb-2 last:border-b-0">
                  <p className="text-sm font-medium">{message.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default function AdminOrders({
  institutionId,
  catalogId,
}: {
  institutionId: string
  catalogId: string
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [itemTypes, setItemTypes] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('creation_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<string | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null)
  const [openEmail, setOpenEmail] = useState(false)
  const [openItem, setOpenItem] = useState(false)
  const [openSerialNumber, setOpenSerialNumber] = useState(false)
  const [openItemType, setOpenItemType] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [validatingOrder, setValidatingOrder] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [validatingOrders, setValidatingOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/admin/orders?catalog=${catalogId}`)
        if (!res.ok) throw new Error("Error loading orders.")
        const data = await res.json()
        setOrders(data.orders || [])
        setItemTypes(data.itemTypes || [])
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

  const uniqueEmails = Array.from(new Set(orders.map(order => order.user_email))).sort()

  const uniqueItems = Array.from(
    new Set(
      orders.flatMap(order => 
        order.items.map(item => item.name)
      )
    )
  ).sort()

  const uniqueSerialNumbers = Array.from(
    new Set(
      orders.flatMap(order => 
        order.items
          .map(item => item.serial_number)
          .filter((serial): serial is string => serial !== null && serial !== undefined)
      )
    )
  ).sort()

  const uniqueItemTypes = itemTypes.map(type => type.name).sort()

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' 
      ? true 
      : statusFilter === 'completed' 
        ? order.status 
        : statusFilter === 'in_progress'
          ? !order.status
          : statusFilter === 'delay'
            ? !order.status && order.end_date && new Date(order.end_date) < new Date()
            : true

    const emailMatch = selectedEmail ? order.user_email === selectedEmail : true

    const itemMatch = selectedItem 
      ? order.items.some(item => item.name === selectedItem)
      : true

    const serialNumberMatch = selectedSerialNumber
      ? order.items.some(item => item.serial_number === selectedSerialNumber)
      : true

    const itemTypeMatch = selectedItemType
      ? order.items.some(item => item.item_type === selectedItemType)
      : true

    return statusMatch && emailMatch && itemMatch && serialNumberMatch && itemTypeMatch
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


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleValidateOrder = async (orderId: string) => {
    setValidatingOrder(orderId)
    try {
      const result = await adminValidateOrderReturn(orderId)
      if (result.success) {
        // Refresh the orders data
        const res = await fetch(`/api/admin/orders?catalog=${catalogId}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } else {
        alert(result.message)
      }
      
    } catch (error) {
      alert(`Error validating orders: ${error}`)
    } finally {
      setValidatingOrder(null)
    }
  }

  const handleValidateMultipleOrders = async () => {
    if (selectedOrders.size === 0) return

    setValidatingOrders(new Set(selectedOrders))
    try {
      const promises = Array.from(selectedOrders).map(orderId => adminValidateOrderReturn(orderId))
      const results = await Promise.all(promises)
      
      const successCount = results.filter(result => result.success).length
      const errorCount = results.length - successCount
      
      if (errorCount > 0) {
        alert(`${successCount} orders validated successfully. ${errorCount} orders failed to validate.`)
      } else {
        alert(`${successCount} orders validated successfully!`)
      }
      
      // Refresh the orders data
      const res = await fetch(`/api/admin/orders?catalog=${catalogId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
      
      // Clear selection
      setSelectedOrders(new Set())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert(`Error validating orders: ${error}`)
    } finally {
      setValidatingOrders(new Set())
    }
  }

  const toggleSelectAll = () => {
    const validatableOrders = sortedAndFilteredOrders
      .filter(order => order.status && !order.validation)
      .map(order => order.id)
    
    if (selectedOrders.size === validatableOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(validatableOrders))
    }
  }

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const getValidatableOrdersCount = () => {
    return sortedAndFilteredOrders.filter(order => order.status && !order.validation).length
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
              <SelectItem value="completed">Returned by student</SelectItem>
              <SelectItem value="in_progress">Loan in progress</SelectItem>
              <SelectItem value="delay">Overdue</SelectItem>
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

          <Popover open={openSerialNumber} onOpenChange={setOpenSerialNumber}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSerialNumber}
                className="w-[200px] justify-between"
              >
                {selectedSerialNumber || "Select serial number..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search serial number..." />
                <CommandEmpty>No serial number found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedSerialNumber(null)
                      setOpenSerialNumber(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedSerialNumber ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All serial numbers
                  </CommandItem>
                  {uniqueSerialNumbers.map((serialNumber) => (
                    <CommandItem
                      key={serialNumber}
                      onSelect={() => {
                        setSelectedSerialNumber(serialNumber)
                        setOpenSerialNumber(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSerialNumber === serialNumber ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {serialNumber}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={openItemType} onOpenChange={setOpenItemType}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openItemType}
                className="w-[200px] justify-between"
              >
                {selectedItemType || "Select item type..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search item type..." />
                <CommandEmpty>No item type found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedItemType(null)
                      setOpenItemType(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedItemType ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All item types
                  </CommandItem>
                  {uniqueItemTypes.map((itemType) => (
                    <CommandItem
                      key={itemType}
                      onSelect={() => {
                        setSelectedItemType(itemType)
                        setOpenItemType(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedItemType === itemType ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {itemType}
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

      {/* Bulk validation controls */}
      {getValidatableOrdersCount() > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedOrders.size === getValidatableOrdersCount() && getValidatableOrdersCount() > 0}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select all validatable orders ({getValidatableOrdersCount()})
              </Label>
            </div>
            {selectedOrders.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedOrders.size} order(s) selected
              </span>
            )}
          </div>
          {selectedOrders.size > 0 && (
            <Button
              onClick={handleValidateMultipleOrders}
              disabled={validatingOrders.size > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {validatingOrders.size > 0 ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Validate {selectedOrders.size} order(s)
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <Table>
        <TableCaption>List of recent orders.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Select</TableHead>
            <TableHead className="w-[200px]">Order ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Creation date</TableHead>
            <TableHead>End date</TableHead>
            <TableHead>Total items</TableHead>
            <TableHead>User email</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndFilteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                {order.status && !order.validation && (
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => toggleSelectOrder(order.id)}
                    disabled={validatingOrders.has(order.id)}
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>
                {order.status ? (
                  <div className="flex items-center gap-2">
                    <span>{order.validation ? "Return validated" : "Returned by student"}</span>
                    {order.validation && (
                      <span title="Validated by admin">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </span>
                    )}
                  </div>
                ) : (
                  <span className={order.end_date && new Date(order.end_date) < new Date() ? "text-red-600 font-medium" : ""}>
                    {order.end_date && new Date(order.end_date) < new Date() ? "Overdue" : "Loan in progress"}
                  </span>
                )}
              </TableCell>
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
                            <p className="text-sm">Quantity: {item.quantity}</p>
                            {item.serial_number && (
                              <p className="text-sm text-gray-600">Serial: {item.serial_number}</p>
                            )}
                            {item.item_type && (
                              <p className="text-sm text-gray-600">Type: {item.item_type}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-4">
                    <div className="space-y-4">
                      <MessageForm orderId={order.id} />
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8}>Total</TableCell>
            <TableCell>{sortedAndFilteredOrders.length} order(s)</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="hidden">{institutionId}</div>
    </div>
  )
}
