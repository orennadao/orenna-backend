'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { LiftUnit } from '@/types/api'

export function useLiftUnits(params?: {
  status?: string;
  projectId?: number;
  limit?: number;
  offset?: number;
}) {
  const [liftUnits, setLiftUnits] = useState<LiftUnit[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLiftUnits = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getLiftUnits(params) as any
      setLiftUnits(response.liftUnits || response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lift units')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiftUnits()
  }, [params?.status, params?.projectId, params?.limit, params?.offset])

  return {
    liftUnits,
    total,
    isLoading,
    error,
    refetch: fetchLiftUnits
  }
}

export function useLiftUnit(liftUnitId: number) {
  const [liftUnit, setLiftUnit] = useState<LiftUnit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLiftUnit = async () => {
    if (!liftUnitId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getLiftUnit(liftUnitId) as LiftUnit
      setLiftUnit(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lift unit')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLiftUnit()
  }, [liftUnitId])

  return {
    liftUnit,
    isLoading,
    error,
    refetch: fetchLiftUnit
  }
}