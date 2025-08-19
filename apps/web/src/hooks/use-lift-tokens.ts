'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { LiftToken } from '@/types/api'

export function useLiftTokens(params?: {
  status?: string;
  projectId?: number;
  limit?: number;
  offset?: number;
}) {
  const [liftTokens, setLiftTokens] = useState<LiftToken[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLiftTokens = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getLiftTokens(params) as any
      setLiftTokens(response.liftTokens || response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lift tokens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiftTokens()
  }, [params?.status, params?.projectId, params?.limit, params?.offset])

  return {
    liftTokens,
    total,
    isLoading,
    error,
    refetch: fetchLiftTokens
  }
}

export function useLiftToken(liftTokenId: number) {
  const [liftToken, setLiftToken] = useState<LiftToken | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLiftToken = async () => {
    if (!liftTokenId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getLiftToken(liftTokenId) as LiftToken
      setLiftToken(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lift token')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiftToken()
  }, [liftTokenId])

  return {
    liftToken,
    isLoading,
    error,
    refetch: fetchLiftToken
  }
}