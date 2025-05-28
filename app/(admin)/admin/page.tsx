'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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

import { Button } from "@/components/ui/button"

import AdminInstitutionForm from "@/components/admin-institution-form"

interface Institution {
    id: string
    name: string
    acronym: string
}

export default function Page() {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [catalogFormOpen, setCatalogFormOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetch('/api/admin/institutions')
        .then(res => res.json())
        .then(data => setInstitutions(data))
        .catch(err => console.error('Failed to fetch institutions:', err))
    }, [])

    function onSelect(value: string) {
        const inst = institutions.find(i => i.acronym === value)
        if (inst) {
            router.push(`/admin/${inst.id}`)
        }
    }

    return (
        <main className="flex justify-center mt-20 ">
            <div className="flex flex-col justify-center w-full max-w-[70%] space-y-4">
                <div>
                    <Popover open={catalogFormOpen} onOpenChange={setCatalogFormOpen}>
                        <PopoverTrigger asChild>
                            <Button className="flex cursor-pointer w-full" variant="outline">
                                <span>Create institution</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div>
                                <AdminInstitutionForm />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                {/* Command avec scroll */}
                <Command className="w-full">
                    <CommandInput placeholder="Search institution..." />
                    <CommandList className="max-h-80 overflow-y-auto">
                        <CommandEmpty>No institutions found.</CommandEmpty>
                        <CommandGroup>
                            {institutions.map(inst => (
                                <CommandItem
                                    key={inst.id}
                                    value={inst.acronym}
                                    onSelect={onSelect}
                                    className="cursor-pointer"
                                >
                                    {inst.acronym}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </main>
    )
}
