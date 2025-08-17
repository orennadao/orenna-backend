'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { IndexedEvent, IndexerState } from '@/types/api'

export function useIndexerStatus() {
  const [status, setStatus] = useState<IndexerState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getIndexerStatus() as any
      setStatus(response.indexers || response || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch indexer status')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus
  }
}

export function useIndexedEvents(params?: {
  chainId?: number;
  contractAddress?: string;
  eventName?: string;
  processed?: boolean;
  limit?: number;
  offset?: number;
}) {
  const [events, setEvents] = useState<IndexedEvent[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getIndexedEvents(params) as any
      setEvents(response.events || response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch indexed events')
    } finally {
      setIsLoading(false)
    }
  }, [params?.chainId, params?.contractAddress, params?.eventName, params?.processed, params?.limit, params?.offset])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    total,
    isLoading,
    error,
    refetch: fetchEvents
  }
}