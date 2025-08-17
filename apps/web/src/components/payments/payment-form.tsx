'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useCreatePayment } from '@/hooks/use-payments'
import { useProjects } from '@/hooks/use-projects'
import type { PaymentType, CreatePaymentRequest } from '@/types/api'

interface PaymentFormProps {
  onSuccess?: (paymentId: string) => void
  onCancel?: () => void
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { projects, isLoading: projectsLoading } = useProjects()
  const { createPayment, isLoading, error } = useCreatePayment()

  const [formData, setFormData] = useState<Partial<CreatePaymentRequest>>({
    paymentType: 'LIFT_UNIT_PURCHASE',
    chainId: chainId || 1,
    payerAddress: address || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.projectId || !formData.amount || !formData.paymentToken || !formData.recipientAddress) {
      return
    }

    try {
      const payment: CreatePaymentRequest = {
        projectId: formData.projectId,
        paymentType: formData.paymentType as PaymentType,
        amount: formData.amount,
        paymentToken: formData.paymentToken,
        payerAddress: formData.payerAddress!,
        recipientAddress: formData.recipientAddress,
        chainId: formData.chainId!,
        description: formData.description,
        metadata: formData.metadata,
      }

      const result = await createPayment(payment) as any
      onSuccess?.(result.paymentId)
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const handleChange = (field: keyof CreatePaymentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Create Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={formData.projectId || ''}
            onChange={(e) => handleChange('projectId', Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
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

        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type
          </label>
          <select
            value={formData.paymentType}
            onChange={(e) => handleChange('paymentType', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            required
          >
            <option value="LIFT_UNIT_PURCHASE">Lift Unit Purchase</option>
            <option value="PROJECT_FUNDING">Project Funding</option>
            <option value="REPAYMENT">Repayment</option>
            <option value="PLATFORM_FEE">Platform Fee</option>
            <option value="STEWARD_PAYMENT">Steward Payment</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (in wei)
          </label>
          <input
            type="text"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="1000000000000000000"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            required
          />
        </div>

        {/* Payment Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Token
          </label>
          <select
            value={formData.paymentToken || ''}
            onChange={(e) => handleChange('paymentToken', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            required
          >
            <option value="">Select payment token</option>
            <option value="0x0000000000000000000000000000000000000000">ETH</option>
            <option value="0xA0b86a33E6441C8C8b4cA1b23B977999Df8b0C1C">USDC</option>
            <option value="0xdAC17F958D2ee523a2206206994597C13D831ec7">USDT</option>
          </select>
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipientAddress || ''}
            onChange={(e) => handleChange('recipientAddress', e.target.value)}
            placeholder="0x..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[44px]"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm min-h-[100px]"
            placeholder="Payment description..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !address}
          >
            {isLoading ? 'Creating...' : 'Create Payment'}
          </Button>
        </div>
      </form>
    </div>
  )
}