'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage, useChainId } from 'wagmi'
import { authService, type AuthUser } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const chainId = useChainId()

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((newUser) => {
      setUser(newUser)
      setIsLoading(false)
    })

    // Initialize auth state
    authService.initialize()

    return unsubscribe
  }, [])

  // Sign in with Ethereum
  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }

    setIsAuthenticating(true)
    
    try {
      // Get nonce from backend
      const nonce = await authService.getNonce()
      
      // Create SIWE message
      const message = authService.createSiweMessage(address, chainId, nonce)
      
      // Sign the message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
      
      // Verify with backend
      const result = await authService.verifySiwe(message, signature)
      
      if (!result.success) {
        throw new Error(result.error || 'Authentication failed')
      }

      return result.user
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, isConnected, chainId, signMessageAsync])

  // Sign out
  const signOut = useCallback(async () => {
    await authService.logout()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}