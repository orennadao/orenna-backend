'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getPayments(params) as any
      // Handle our API response format: { success: true, data: [...], meta: { pagination: {...} } }
      if (response.success && Array.isArray(response.data)) {
        setPayments(response.data)
        setTotal(response.meta?.pagination?.total || response.data.length)
      } else {
        setPayments(response.payments || response.data || [])
        setTotal(response.total || response.meta?.pagination?.total || 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }, [params?.status, params?.paymentType, params?.chainId, params?.payerAddress, params?.limit, params?.offset])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

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

  const fetchPayment = useCallback(async () => {
    if (!paymentId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getPayment(paymentId) as any
      // Handle our API response format: { success: true, data: {...} }
      if (response.success && response.data) {
        setPayment(response.data)
      } else {
        setPayment(response)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment')
    } finally {
      setIsLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    fetchPayment()
  }, [fetchPayment])

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
      const response = await apiClient.createPayment(payment) as any
      // Handle our API response format: { success: true, data: {...} }
      if (response.success && response.data) {
        return response.data
      }
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