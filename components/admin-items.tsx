'use client'

import { useEffect, useState, useCallback } from "react"
import AdminItemForm from "@/components/admin-item-form"
import AdminTypesForm from "@/components/admin-types-form"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "./ui/separator"
import { Button } from "./ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
//import { useRouter } from "next/navigation"

interface Item {
  id: string
  name: string
  description: string
  default_quantity: number
  actual_quantity: number
  created_at: string
  catalog_id: string
  serial_number?: string
  item_type_id?: string
  items_types?: {
    name: string
  }
}

interface ItemType {
  id: string
  name: string
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
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  //, setLoading] = useState(false)
  //const router = useRouter()

  const triggerRefetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (!catalogId) return

    const fetchData = async () => {
      try {
        // Fetch items
        const itemsRes = await fetch(`/api/admin/items?catalog=${catalogId}`)
        const itemsData = await itemsRes.json()
        setItems(itemsData)

        // Fetch item types
        const typesRes = await fetch(`/api/admin/types?catalog=${catalogId}`)
        const typesData = await typesRes.json()
        setItemTypes(typesData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }

    fetchData()
  }, [catalogId, refetchTrigger])

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item ?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting item:', error)
      return
    }

    // Supprimer l'image associée si elle existe
    await supabase
      .storage
      .from('items')
      .remove([`${itemId}.jpg`])

    // Rafraîchir la liste des items
    triggerRefetch()
  }

  const handleEdit = async (itemId: string, formData: FormData) => {
    const supabase = createClient()
    
    const { error: updateError } = await supabase
      .from('items')
      .update({
        name: formData.get('item_name'),
        description: formData.get('item_description'),
        default_quantity: Number(formData.get('item_quantity')),
        actual_quantity: Number(formData.get('item_quantity')),
        serial_number: formData.get('serial_number') || null,
        item_type_id: formData.get('item_type_id') || null,
      })
      .eq('id', itemId)

    if (updateError) {
      console.error('Error updating item:', updateError)
      return
    }

    const imageFile = formData.get('item_image') as File
    if (imageFile && imageFile.size > 0) {
      const { error: uploadError } = await supabase
        .storage
        .from('items')
        .upload(`${itemId}.jpg`, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
      }
    }

    triggerRefetch()
  }

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this item type ?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('items_types')
      .delete()
      .eq('id', typeId)

    if (error) {
      console.error('Error deleting item type:', error)
      return
    }

    // Rafraîchir la liste des types
    triggerRefetch()
  }

  const handleEditType = async (typeId: string, formData: FormData) => {
    const supabase = createClient()
    
    const { error: updateError } = await supabase
      .from('items_types')
      .update({
        name: formData.get('type_name'),
      })
      .eq('id', typeId)

    if (updateError) {
      console.error('Error updating item type:', updateError)
      return
    }

    triggerRefetch()
  }

  return (
    <div className="flex flex-col p-2">
      <div className="flex justify-center gap-8">
        <AdminItemForm catalogId={catalogId} onSuccess={triggerRefetch} />
        <AdminTypesForm catalogId={catalogId} onSuccess={triggerRefetch} />
      </div>
      <Separator className="my-6"/>
      <Table>
        <TableCaption>List of catalog items</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Default quantity</TableHead>
            <TableHead>Quantity available</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Item Type</TableHead>
            <TableHead>Creation date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.default_quantity}</TableCell>
                <TableCell>{item.actual_quantity}</TableCell>
                <TableCell>{item.serial_number || '-'}</TableCell>
                <TableCell>{item.items_types?.name || '-'}</TableCell>
                <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-4">
                        <form action={async (formData) => {
                          await handleEdit(item.id, formData)
                        }}>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="item_name" className="text-sm font-medium">Name</label>
                              <input
                                id="item_name"
                                name="item_name"
                                defaultValue={item.name}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="item_description" className="text-sm font-medium">Description</label>
                              <input
                                id="item_description"
                                name="item_description"
                                defaultValue={item.description}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="item_quantity" className="text-sm font-medium">Quantity</label>
                              <input
                                id="item_quantity"
                                name="item_quantity"
                                type="number"
                                defaultValue={item.default_quantity}
                                min={1}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="serial_number" className="text-sm font-medium">Serial Number (max 30 characters, optional)</label>
                              <input
                                id="serial_number"
                                name="serial_number"
                                type="text"
                                defaultValue={item.serial_number || ''}
                                maxLength={30}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="item_type_id" className="text-sm font-medium">Item Type (optional)</label>
                              <select 
                                id="item_type_id" 
                                name="item_type_id"
                                defaultValue={item.item_type_id || ''}
                                className="w-full border rounded-md px-3 py-2 text-sm"
                              >
                                <option value="">Select a type (optional)</option>
                                {itemTypes.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="item_image" className="text-sm font-medium">New image (JPEG only)</label>
                              <input
                                id="item_image"
                                name="item_image"
                                type="file"
                                accept="image/jpeg"
                                className="w-full border rounded-md px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                              />
                            </div>
                            <Button type="submit" className="w-full">Modifiy</Button>
                          </div>
                        </form>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Separator className="my-6"/>
      <Table>
        <TableCaption>List of item types</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Creation date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itemTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No item types found.
              </TableCell>
            </TableRow>
          ) : (
            itemTypes.map((itemType) => (
              <TableRow key={itemType.id}>
                <TableCell>{itemType.name}</TableCell>
                <TableCell>{new Date(itemType.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-4">
                      <form action={async (formData) => {
                        await handleEditType(itemType.id, formData)
                      }}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="type_name" className="text-sm font-medium">Name</label>
                            <input
                              id="type_name"
                              name="type_name"
                              defaultValue={itemType.name}
                              className="w-full border rounded-md px-3 py-2 text-sm"
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">Modifiy</Button>
                        </div>
                      </form>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteType(itemType.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="hidden">{institutionId}</div>
    </div>
  )
}
