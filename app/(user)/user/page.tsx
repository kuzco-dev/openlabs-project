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
import { Check, ChevronsUpDown, ShoppingCart, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import UserItems from "@/components/user-items"
import UserBag from "@/components/user-bag"
import { BagProvider, useBag } from "@/lib/bag-context"
import { QRScanner } from "@/components/ui/qr-scanner"

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

function UserCatalogSelectorContent() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null)
  const [openInstitution, setOpenInstitution] = useState(false)
  const [openCatalog, setOpenCatalog] = useState(false)
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const { clearBag, addItem } = useBag()
  const [previousCatalogId, setPreviousCatalogId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/all')
      .then(res => res.json())
      .then(data => setInstitutions(data))
      .catch(err => console.error("Failed to fetch institutions", err))
  }, [])

  useEffect(() => {
    if (selectedCatalog && previousCatalogId && selectedCatalog.id !== previousCatalogId) {
      clearBag()
    }
    if (selectedCatalog) {
      setPreviousCatalogId(selectedCatalog.id)
    }
  }, [selectedCatalog, previousCatalogId, clearBag])



  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution)
    setSelectedCatalog(null)
    setOpenInstitution(false)
  }

  const handleCatalogSelect = (catalog: Catalog) => {
    setSelectedCatalog(catalog)
    setOpenCatalog(false)
  }

  const handleQRScan = async (decodedText: string) => {
    // Vérifications de sécurité
    if (!decodedText || typeof decodedText !== 'string') {
      setScanMessage("Invalid QR code")
      setIsQRScannerOpen(false)
      return
    }

    if (!selectedCatalog) {
      setScanMessage("Please select a catalog first")
      setIsQRScannerOpen(false)
      return
    }

    // Valider que decodedText est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(decodedText)) {
      setScanMessage("Invalid QR code")
      setIsQRScannerOpen(false)
      return
    }

    try {
      // Vérifier si l'item existe dans le catalogue actuel
      const response = await fetch(`/api/user/items?catalog_id=${selectedCatalog.id}`)
      if (!response.ok) {
        throw new Error('Error retrieving items')
      }
      
      const items = await response.json()
      if (!Array.isArray(items)) {
        throw new Error('Invalid response format')
      }
      
      const scannedItem = items.find((item: any) => item && item.id === decodedText)
      
      if (!scannedItem) {
        setScanMessage("This QR code doesn't match any item in this catalog")
        setIsQRScannerOpen(false)
        return
      }

      // Vérifier si l'item est disponible
      if (scannedItem.actual_quantity <= 0) {
        setScanMessage("This item is no longer available")
        setIsQRScannerOpen(false)
        return
      }

      // Vérifier que les propriétés nécessaires existent
      if (!scannedItem.id || !scannedItem.name || !scannedItem.catalog_id) {
        setScanMessage("Incomplete item data")
        setIsQRScannerOpen(false)
        return
      }

      // Ajouter l'item au panier avec une quantité de 1
      addItem({
        id: scannedItem.id,
        name: scannedItem.name,
        catalog_id: scannedItem.catalog_id
      }, 1)

      setScanMessage(`Item "${scannedItem.name}" added to cart successfully!`)
      setIsQRScannerOpen(false)
      
      // Effacer le message après 3 secondes
      setTimeout(() => {
        setScanMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error during scan:', error)
      setScanMessage("Error scanning QR code")
      setIsQRScannerOpen(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Institution Picker */}
      <div className="h-14 p-2 flex items-center justify-between gap-4 border-b overflow-x-auto scrollbar-hide">
        <div className="flex gap-4">
          <div>
            <Popover open={openInstitution} onOpenChange={setOpenInstitution}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between cursor-pointer"
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
                    className="w-full justify-between cursor-pointer"
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsQRScannerOpen(true)}
            className="cursor-pointer"
            disabled={!selectedCatalog}
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <span>Bag</span>
                <ShoppingCart className="ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" >
              <UserBag catalogId={selectedCatalog?.id || ''} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedCatalog && (
        <div>
          <UserItems catalogId={selectedCatalog.id} />
        </div>
      )}

      {/* Messages de scan */}
      {scanMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          scanMessage.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <span>{scanMessage}</span>
            <button
              onClick={() => setScanMessage(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Scanner QR */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScan}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  )
}

export default function UserCatalogSelector() {
  return (
    <BagProvider>
      <UserCatalogSelectorContent />
    </BagProvider>
  )
}
