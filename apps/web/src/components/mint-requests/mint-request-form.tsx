'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCreateMintRequest } from '@/hooks/use-mint-requests'
import { useProjects } from '@/hooks/use-projects'
import type { CreateMintRequestRequest } from '@/types/api'

interface MintRequestFormProps {
  onSuccess?: (mintRequestId: string) => void
  onCancel?: () => void
}

export function MintRequestForm({ onSuccess, onCancel }: MintRequestFormProps) {
  const [formData, setFormData] = useState<Partial<CreateMintRequestRequest>>({
    projectId: undefined,
    tokenId: '',
    amount: '',
    recipient: '',
    title: '',
    description: ''
  })

  const { createMintRequest, isLoading, error } = useCreateMintRequest()
  const { projects } = useProjects()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId || !formData.amount || !formData.recipient || !formData.title || !formData.tokenId) {
      return
    }

    try {
      const response = await createMintRequest({
        projectId: formData.projectId,
        tokenId: formData.tokenId,
        amount: formData.amount,
        recipient: formData.recipient,
        title: formData.title,
        description: formData.description || ''
      }) as any
      
      onSuccess?.(response.id)
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const handleInputChange = (field: keyof CreateMintRequestRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Create Mint Request</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
            Project *
          </label>
          <select
            id="project"
            value={formData.projectId || ''}
            onChange={(e) => handleInputChange('projectId', parseInt(e.target.value) || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            required
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <input
            type="text"
            id="amount"
            value={formData.amount || ''}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            placeholder="e.g., 1000 LIFT"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-2">
            Token ID *
          </label>
          <input
            type="text"
            id="tokenId"
            value={formData.tokenId || ''}
            onChange={(e) => handleInputChange('tokenId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            placeholder="Token identifier"
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            placeholder="Mint request title"
            required
          />
        </div>

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient *
          </label>
          <input
            type="text"
            id="recipient"
            value={formData.recipient || ''}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            placeholder="Recipient wallet address"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[100px]"
            placeholder="Describe the purpose of this mint request..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.projectId || !formData.amount || !formData.recipient || !formData.title || !formData.tokenId}
            className="flex-1"
          >
            {isLoading ? 'Creating...' : 'Create Mint Request'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}