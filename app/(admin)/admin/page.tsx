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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"

interface Institution {
    id: string
    name: string
    acronym: string
}

export default function Page() {
    const [institutions, setInstitutions] = useState<Institution[]>([])
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full cursor-pointer">Create institution</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                account and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
