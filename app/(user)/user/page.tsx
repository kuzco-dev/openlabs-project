'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import UserItems from "@/components/user-items"

interface Catalog {
  id: string
  name: string
  acronym: string
}

interface Institution {
  id: string
  name: string
  acronym: string
  catalogs: Catalog[]
}

export default function UserCatalogSelector() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)
  const [openInstitution, setOpenInstitution] = useState(false)
  const [openCatalog, setOpenCatalog] = useState(false)

  useEffect(() => {
    fetch('/api/user/all')
      .then(res => res.json())
      .then(data => setInstitutions(data))
      .catch(err => console.error("Failed to fetch institutions", err))
  }, [])

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution)
    setSelectedCatalog(null)
    setOpenInstitution(false)
  }

  const handleCatalogSelect = (catalog: Catalog) => {
    setSelectedCatalog(catalog)
    setOpenCatalog(false)
  }

  return (
    <div className="flex flex-col">
      {/* Institution Picker */}
      <div className="h-14 p-2 flex items-center gap-4 border-b">
        <div>
            <Popover open={openInstitution} onOpenChange={setOpenInstitution}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                >
                {selectedInstitution
                    ? `${selectedInstitution.acronym}`
                    : "Select institution"}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                <CommandInput placeholder="Search institution..." />
                <CommandList>
                    <CommandEmpty>No institutions found.</CommandEmpty>
                    <CommandGroup>
                    {institutions.map((institution) => (
                        <CommandItem
                        key={institution.id}
                        value={institution.acronym}
                        onSelect={() => handleInstitutionSelect(institution)}
                        >
                        {institution.acronym}
                        <Check
                            className={cn(
                            "ml-auto",
                            selectedInstitution?.id === institution.id
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

        {/* Catalog Picker */}
        {selectedInstitution && (
            <div>
            <Popover open={openCatalog} onOpenChange={setOpenCatalog}>
                <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                >
                    {selectedCatalog
                    ? `${selectedCatalog.acronym}`
                    : "Select catalog"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search catalog..." />
                    <CommandList>
                    <CommandEmpty>No catalogs found.</CommandEmpty>
                    <CommandGroup>
                        {selectedInstitution.catalogs.map((catalog) => (
                        <CommandItem
                            key={catalog.id}
                            value={catalog.acronym}
                            onSelect={() => handleCatalogSelect(catalog)}
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
        )}
      </div>

      {selectedCatalog && (
        <div>
          <UserItems catalogId={selectedCatalog.id} />
        </div>
      )}
    </div>
  )
}
