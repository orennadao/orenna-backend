'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { Project } from '@/types/api'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getProjects() as any
      // Handle our API response format: { success: true, data: [...], meta: { pagination: {...} } }
      if (response.success && Array.isArray(response.data)) {
        setProjects(response.data)
      } else {
        setProjects(response.projects || response.data || response || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects
  }
}

export function useProject(projectId: number) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getProject(projectId) as Project
      setProject(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  return {
    project,
    isLoading,
    error,
    refetch: fetchProject
  }
}