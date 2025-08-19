'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { apiClient } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function CreateLiftTokenForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    projectId: '',
    tokenId: '',
    maxSupply: '',
    quantity: '',
    unit: 'LU',
    uri: '',
    meta: {
      title: '',
      description: '',
      methodology: '',
      location: '',
      vintageYear: ''
    }
  })

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('meta.')) {
      const metaField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        meta: { ...prev.meta, [metaField]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        projectId: formData.projectId ? Number(formData.projectId) : undefined,
        tokenId: formData.tokenId,
        maxSupply: formData.maxSupply,
        quantity: formData.quantity || undefined,
        unit: formData.unit,
        uri: formData.uri || undefined,
        meta: Object.fromEntries(
          Object.entries(formData.meta).filter(([_, value]) => value !== '')
        )
      }

      const response = await apiClient.createLiftToken(payload)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // Redirect to the created lift token
      router.push(`/lift-tokens/${response.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lift token')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/lift-tokens">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lift Tokens
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Lift Token</h1>
          <p className="text-gray-600 mt-2">
            Create a new lift token representing verified environmental improvements
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tokenId">Token ID *</Label>
              <Input
                id="tokenId"
                type="text"
                required
                placeholder="e.g., 1001"
                value={formData.tokenId}
                onChange={(e) => handleInputChange('tokenId', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Unique identifier for this token on the blockchain
              </p>
            </div>

            <div>
              <Label htmlFor="maxSupply">Max Supply *</Label>
              <Input
                id="maxSupply"
                type="text"
                required
                placeholder="e.g., 1000000"
                value={formData.maxSupply}
                onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Maximum number of tokens that can be minted
              </p>
            </div>

            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                type="number"
                placeholder="e.g., 123"
                value={formData.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Associate with an existing project (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="text"
                placeholder="e.g., 500"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Initial quantity to create (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
              >
                <option value="LU">LU (Lift Units)</option>
                <option value="tCO2e">tCO2e (Tonnes CO2 Equivalent)</option>
                <option value="MWh">MWh (Megawatt Hours)</option>
                <option value="m3">m³ (Cubic Meters)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="hectares">Hectares</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="uri">Token URI</Label>
              <Input
                id="uri"
                type="url"
                placeholder="https://example.com/metadata/token/123"
                value={formData.uri}
                onChange={(e) => handleInputChange('uri', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Custom metadata URI (optional, auto-generated if empty)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Forest Conservation Credits"
                value={formData.meta.title}
                onChange={(e) => handleInputChange('meta.title', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the environmental improvement this token represents..."
                rows={3}
                value={formData.meta.description}
                onChange={(e) => handleInputChange('meta.description', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="methodology">Methodology</Label>
                <Input
                  id="methodology"
                  type="text"
                  placeholder="e.g., VWBA, VM0011"
                  value={formData.meta.methodology}
                  onChange={(e) => handleInputChange('meta.methodology', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., California, USA"
                  value={formData.meta.location}
                  onChange={(e) => handleInputChange('meta.location', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="vintageYear">Vintage Year</Label>
                <Input
                  id="vintageYear"
                  type="text"
                  placeholder="e.g., 2024"
                  value={formData.meta.vintageYear}
                  onChange={(e) => handleInputChange('meta.vintageYear', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/lift-tokens">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.tokenId || !formData.maxSupply}
          >
            {isSubmitting ? 'Creating...' : 'Create Lift Token'}
          </Button>
        </div>
      </form>
    </div>
  )
}