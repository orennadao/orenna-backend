'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { MintRequest, CreateMintRequestRequest } from '@/types/api'

export function useMintRequests(params?: {
  status?: string;
  projectId?: number;
  requestedBy?: string;
  limit?: number;
  offset?: number;
}) {
  const [mintRequests, setMintRequests] = useState<MintRequest[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMintRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getMintRequests(params) as any
      setMintRequests(response.mintRequests || response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mint requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMintRequests()
  }, [params?.status, params?.projectId, params?.requestedBy, params?.limit, params?.offset])

  return {
    mintRequests,
    total,
    isLoading,
    error,
    refetch: fetchMintRequests
  }
}

export function useMintRequest(mintRequestId: string) {
  const [mintRequest, setMintRequest] = useState<MintRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMintRequest = async () => {
    if (!mintRequestId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getMintRequest(mintRequestId) as MintRequest
      setMintRequest(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mint request')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMintRequest()
  }, [mintRequestId])

  return {
    mintRequest,
    isLoading,
    error,
    refetch: fetchMintRequest
  }
}

export function useCreateMintRequest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMintRequest = async (request: CreateMintRequestRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.createMintRequest(request)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mint request'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createMintRequest,
    isLoading,
    error
  }
}

export function useUpdateMintRequest() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateMintRequest = async (mintRequestId: string, update: {
    status: 'APPROVED' | 'REJECTED';
    approvalNotes?: string;
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.updateMintRequest(mintRequestId, update)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mint request'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateMintRequest,
    isLoading,
    error
  }
}