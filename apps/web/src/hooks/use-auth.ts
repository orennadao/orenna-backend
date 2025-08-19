'use client'

import { useState, useEffect } from 'react'

interface User {
  address?: string;
  email?: string;
  name?: string;
  chainId?: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Simplified auth for testing - no wagmi dependencies
  const isAuthenticated = true
  const isConnected = true

  return {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    isConnected,
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  }
}