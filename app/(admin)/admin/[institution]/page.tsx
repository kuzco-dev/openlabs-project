'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useParams } from 'next/navigation'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import AdminOverview from "@/components/admin-overview"
import AdminOrders from "@/components/admin-orders"
import AdminItems from "@/components/admin-items"
import AdminUsers from "@/components/admin-users"

interface Catalog {
    id: string
    name: string
    description: string
    institution_id: string
    created_at: string
}

export default function Page() {
    const params = useParams()
    const institutionId = params.institution as string

    const [open, setOpen] = useState(false)
    const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)
    const [catalogs, setCatalogs] = useState<Catalog[]>([])
    const [activeTab, setActiveTab] = useState("overview")

    // Fetch catalogs on load
    useEffect(() => {
        if (!institutionId) return

        fetch(`/api/admin/catalogs?institution=${institutionId}`)
            .then(res => res.json())
            .then(data => {
                setCatalogs(data)
                if (data.length > 0) {
                    setSelectedCatalog(data[0])
                }
            })
            .catch(err => console.error("Failed to fetch catalogs", err))
    }, [institutionId])

    const renderContent = () => {
        if (!selectedCatalog) {
            return <div className="text-muted-foreground">Please select a catalog.</div>
        }

        const catalogId = selectedCatalog.id

        switch (activeTab) {
            case "overview":
                return <AdminOverview institutionId={institutionId} catalogId={catalogId} />
            case "orders":
                return <AdminOrders institutionId={institutionId} catalogId={catalogId} />
            case "users":
                return <AdminUsers institutionId={institutionId} catalogId={catalogId} />
            case "items":
                return <AdminItems institutionId={institutionId} catalogId={catalogId} />
            default:
                return null
        }
    }

    return (
        <main>
            <div className='h-14 p-2 flex items-center gap-4 border-b'>
                <div>
                    <Button className="flex cursor-pointer justify-between" variant="outline">
                        <span>New catalog</span>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[200px] justify-between cursor-pointer"
                            >
                                {selectedCatalog?.name ?? "Select catalog"}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search catalog" />
                                <CommandList>
                                    <CommandEmpty>No catalog found.</CommandEmpty>
                                    <CommandGroup>
                                        {catalogs.map((catalog) => (
                                            <CommandItem
                                                key={catalog.id}
                                                value={catalog.name}
                                                onSelect={() => {
                                                    setSelectedCatalog(catalog) // 👈 Mise à jour manuelle
                                                    setOpen(false)
                                                }}
                                            >
                                                {catalog.name}
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        selectedCatalog?.id === catalog.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div><button onClick={() => setActiveTab("overview")} className="cursor-pointer">Overview</button></div>
                <div><button onClick={() => setActiveTab("orders")} className="cursor-pointer">Orders</button></div>
                <div><button onClick={() => setActiveTab("users")} className="cursor-pointer">Users</button></div>
                <div><button onClick={() => setActiveTab("items")} className="cursor-pointer">Items</button></div>
            </div>

            <div className="p-4">
                {renderContent()}
            </div>
        </main>
    )
}