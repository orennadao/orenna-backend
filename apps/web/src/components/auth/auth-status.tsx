'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'

export function AuthStatus() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { isConnected, address } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-red-400 rounded-full" />
        <span>Not connected</span>
      </div>
    )
  }

  if (isConnected && !isAuthenticated) {
    return (
      <div className="flex items-center space-x-2 text-sm text-orange-600">
        <div className="w-2 h-2 bg-orange-400 rounded-full" />
        <span>Connected, not authenticated</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-400 rounded-full" />
        <span>Authenticated as {user.ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}</span>
      </div>
    )
  }

  return null
}