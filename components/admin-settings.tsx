'use client'
import { useEffect, useState } from "react"
import { adminModifyInstitution, adminModifyCatalog, adminDeleteCatalog, adminDeleteInstitution } from "@/utils/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface Catalog {
    id: string
    name: string
    description: string
    acronym: string
    created_at: string
}

interface Institution {
    id: string
    name: string
    description: string
    acronym: string
    catalogs: Catalog[]
}

interface AdminOverviewProps {
    institutionId: string
}

export default function AdminSettings({ institutionId }: AdminOverviewProps) {
    const router = useRouter()
    const [institution, setInstitution] = useState<Institution | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        acronym: ''
    })

    useEffect(() => {
        if (!institutionId) return

        fetch(`/api/admin/settings?institution=${institutionId}`)
            .then(res => res.json())
            .then(data => {
                setInstitution(data)
                setFormData({
                    name: data.name,
                    description: data.description,
                    acronym: data.acronym
                })
            })
            .catch(err => {
                console.error("Failed to fetch institution", err)
                setMessage({ type: 'error', text: 'Failed to load institution data' })
            })
    }, [institutionId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        const form = new FormData()
        form.append('name', formData.name)
        form.append('description', formData.description)
        form.append('acronym', formData.acronym)

        const result = await adminModifyInstitution(institutionId, null, form)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            setIsEditing(false)
            // Refresh the data
            const response = await fetch(`/api/admin/settings?institution=${institutionId}`)
            const data = await response.json()
            setInstitution(data)
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    const handleCatalogEdit = (catalog: Catalog) => {
        setEditingCatalog(catalog)
        setFormData({
            name: catalog.name,
            description: catalog.description,
            acronym: catalog.acronym
        })
    }

    const handleCatalogSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCatalog) return

        setMessage(null)
        const form = new FormData()
        form.append('name', formData.name)
        form.append('description', formData.description)
        form.append('acronym', formData.acronym)

        const result = await adminModifyCatalog(editingCatalog.id, null, form)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            setEditingCatalog(null)
            // Refresh the data
            const response = await fetch(`/api/admin/settings?institution=${institutionId}`)
            const data = await response.json()
            setInstitution(data)
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    const handleCatalogDelete = async (catalogId: string) => {
        if (!confirm('Are you sure you want to delete this catalog? This action cannot be undone.')) {
            return
        }

        const result = await adminDeleteCatalog(catalogId)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            // Refresh the data
            const response = await fetch(`/api/admin/settings?institution=${institutionId}`)
            const data = await response.json()
            setInstitution(data)
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    const handleInstitutionDelete = async () => {
        if (!confirm('Are you sure you want to delete this institution? This action cannot be undone and will delete all associated catalogs.')) {
            return
        }

        const result = await adminDeleteInstitution(institutionId)
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            // Redirect to admin page after successful deletion
            router.push('/admin')
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    if (!institution) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </div>
            <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-medium">Institution settings</h1>
                    <Button 
                        variant="destructive"
                        onClick={handleInstitutionDelete}
                    >
                        Delete Institution
                    </Button>
                </div>
                {!isEditing ? (
                    <>
                        <div>
                            <h3 className="text-lg font-semibold">Name</h3>
                            <p className="text-gray-600">{institution.name}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Description</h3>
                            <p className="text-gray-600">{institution.description}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Acronym</h3>
                            <p className="text-gray-600">{institution.acronym}</p>
                        </div>
                        <Button onClick={() => setIsEditing(true)}>Edit Institution</Button>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                maxLength={30}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                maxLength={40}
                            />
                        </div>
                        <div>
                            <Label htmlFor="acronym">Acronym</Label>
                            <Input
                                id="acronym"
                                name="acronym"
                                value={formData.acronym}
                                onChange={handleInputChange}
                                maxLength={10}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">Save Changes</Button>
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            <div className="space-y-4 border p-4 rounded-lg">
                <h1 className="text-xl font-medium">Catalogs</h1>
                {institution.catalogs && institution.catalogs.length > 0 ? (
                    <div className="grid gap-4">
                        {institution.catalogs.map((catalog) => (
                            <div key={catalog.id} className="border p-4 rounded-lg">
                                {editingCatalog?.id === catalog.id ? (
                                    <form onSubmit={handleCatalogSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor={`catalog-name-${catalog.id}`}>Name</Label>
                                            <Input
                                                id={`catalog-name-${catalog.id}`}
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                maxLength={30}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`catalog-description-${catalog.id}`}>Description</Label>
                                            <Input
                                                id={`catalog-description-${catalog.id}`}
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                maxLength={40}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`catalog-acronym-${catalog.id}`}>Acronym</Label>
                                            <Input
                                                id={`catalog-acronym-${catalog.id}`}
                                                name="acronym"
                                                value={formData.acronym}
                                                onChange={handleInputChange}
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit">Save Changes</Button>
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => setEditingCatalog(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{catalog.name}</h3>
                                            <p className="text-sm text-gray-600">{catalog.description}</p>
                                            <p className="text-sm text-gray-500">Acronym: {catalog.acronym}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleCatalogEdit(catalog)}
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                onClick={() => handleCatalogDelete(catalog.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No catalogs found for this institution.</p>
                )}
            </div>
        </div>
    )
}
