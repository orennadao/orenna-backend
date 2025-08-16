'use client'

import { MintRequestForm } from '@/components/mint-requests/mint-request-form'

export function CreateMintRequestContent() {
  const handleSuccess = (mintRequestId: string) => {
    window.location.href = `/mint-requests`
  }

  const handleCancel = () => {
    window.location.href = '/mint-requests'
  }

  return (
    <MintRequestForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}