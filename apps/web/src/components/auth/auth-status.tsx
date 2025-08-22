'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export function AuthStatus() {
  const { user, isLoading, isAuthenticated, isConnected, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
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
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="hidden sm:inline">
            Authenticated as {user.ensName || `${user.address?.slice(0, 6)}...${user.address?.slice(-4)}`}
          </span>
          <span className="sm:hidden">
            {user.ensName || `${user.address?.slice(0, 6)}...`}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="text-xs px-2 py-1 h-7"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return null
}