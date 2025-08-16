'use client'

import { PaymentForm } from '@/components/payments/payment-form'

export function CreatePaymentContent() {
  const handleSuccess = (paymentId: string) => {
    window.location.href = `/payments/${paymentId}`
  }

  const handleCancel = () => {
    window.location.href = '/payments'
  }

  return (
    <PaymentForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}