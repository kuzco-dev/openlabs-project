'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useParams } from 'next/navigation'
import AdminCatalogForm from '@/components/admin-catalog-form'

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

import AdminOrders from "@/components/admin-orders"
import AdminItems from "@/components/admin-items"
import AdminSettings from "@/components/admin-settings"

interface Catalog {
    id: string
    name: string
    description: string
    institution_id: string
    created_at: string
    acronym: string
}

export default function Page() {
    const params = useParams()
    const institutionId = params.institution as string

    const [open, setOpen] = useState(false)
    const [catalogFormOpen, setCatalogFormOpen] = useState(false)
    const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)
    const [catalogs, setCatalogs] = useState<Catalog[]>([])
    const [activeTab, setActiveTab] = useState("orders")

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
            return <AdminSettings institutionId={institutionId} />
        }

        const catalogId = selectedCatalog.id
        
        switch (activeTab) {
            case "settings":
                return <AdminSettings institutionId={institutionId} />
            case "orders":
                return <AdminOrders institutionId={institutionId} catalogId={catalogId} />
            case "items":
                return <AdminItems institutionId={institutionId} catalogId={catalogId} />
            default:
                return null
        }
    }

    return (
        <main>
            <div className='h-14 p-2 flex felx-wrap items-center gap-4 border-b overflow-x-scroll sm:overflow-x-hidden'>
                <div>
                    <Popover open={catalogFormOpen} onOpenChange={setCatalogFormOpen}>
                        <PopoverTrigger asChild>
                            <Button className="flex cursor-pointer justify-between" variant="outline">
                                <span>New catalog</span>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div>
                                <AdminCatalogForm institutionId={institutionId}/>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[150px] justify-between cursor-pointer"
                            >
                                {selectedCatalog?.acronym ?? "Select catalog"}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[150px] p-0">
                            <Command>
                                <CommandInput placeholder="Search catalog" />
                                <CommandList>
                                    <CommandEmpty>No catalog found.</CommandEmpty>
                                    <CommandGroup>
                                        {catalogs.map((catalog) => (
                                            <CommandItem
                                                key={catalog.id}
                                                value={catalog.acronym}
                                                onSelect={() => {
                                                    setSelectedCatalog(catalog) // 👈 Mise à jour manuelle
                                                    setOpen(false)
                                                }}
                                            >
                                                {catalog.acronym}
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

                <div><button onClick={() => setActiveTab("settings")} className="cursor-pointer">Settings</button></div>
                <div><button onClick={() => setActiveTab("orders")} className="cursor-pointer">Orders</button></div>
                <div><button onClick={() => setActiveTab("items")} className="cursor-pointer">Items</button></div>
            </div>
            <div className="p-4">
                {renderContent()}
            </div>
        </main>
    )
}