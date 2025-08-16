'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { Payment, CreatePaymentRequest } from '@/types/api'

export function usePayments(params?: {
  status?: string;
  paymentType?: string;
  chainId?: number;
  payerAddress?: string;
  limit?: number;
  offset?: number;
}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getPayments(params) as any
      setPayments(response.payments || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [params?.status, params?.paymentType, params?.chainId, params?.payerAddress, params?.limit, params?.offset])

  return {
    payments,
    total,
    isLoading,
    error,
    refetch: fetchPayments
  }
}

export function usePayment(paymentId: string) {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayment = async () => {
    if (!paymentId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getPayment(paymentId) as Payment
      setPayment(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayment()
  }, [paymentId])

  return {
    payment,
    isLoading,
    error,
    refetch: fetchPayment
  }
}

export function useCreatePayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPayment = async (payment: CreatePaymentRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.createPayment(payment)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createPayment,
    isLoading,
    error
  }
}