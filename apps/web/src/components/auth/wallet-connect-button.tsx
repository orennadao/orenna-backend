'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WalletConnectButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
}

export function WalletConnectButton({ className, size = 'sm', children }: WalletConnectButtonProps = {}) {
  const { user, isAuthenticated, signIn, signOut, isAuthenticating, isConnected } = useAuth()
  const router = useRouter()
  const isPending = false
  const connectors = [] // Simplified for testing
  
  const [showConnectors, setShowConnectors] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = async () => {
    try {
      setShowConnectors(false)
      // For now, directly trigger SIWE auth process
      await signIn()
      
      // After successful auth, check if user needs onboarding
      // This would normally check if user exists in DB
      const needsOnboarding = !localStorage.getItem('orenna_onboarding_complete')
      
      if (needsOnboarding) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size={size} 
        disabled 
        className={cn(className)}
      >
        Loading...
      </Button>
    )
  }

  // If wallet is connected but not authenticated
  if (isConnected && !isAuthenticated) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isAuthenticating}
        variant="default"
        size={size}
        className={cn(className)}
      >
        {isAuthenticating ? 'Signing In...' : 'Sign In'}
      </Button>
    )
  }

  // If authenticated, show user info and logout
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-600">
          {user.ensName || user.address ? `${user.address?.slice(0, 6)}...${user.address?.slice(-4)}` : 'User'}
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          size={size}
          className={cn(className)}
        >
          Sign Out
        </Button>
      </div>
    )
  }

  // If not connected, show connect options
  if (!isConnected) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowConnectors(!showConnectors)}
          disabled={isPending || isAuthenticating}
          variant="outline"
          size={size}
          className={cn(className)}
        >
          {isAuthenticating ? 'Connecting...' : (children || 'Connect Wallet')}
        </Button>
        
        {showConnectors && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Connect a wallet</h3>
              <div className="space-y-2">
                <button
                  onClick={handleConnect}
                  disabled={isAuthenticating}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-md border border-gray-200 disabled:opacity-50"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">W</span>
                  </div>
                  <div>
                    <span className="font-medium">Connect Wallet</span>
                    <p className="text-xs text-gray-500">Sign in with Ethereum</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Backdrop to close modal */}
        {showConnectors && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowConnectors(false)}
          />
        )}
      </div>
    )
  }

  return (
    <Button
      onClick={signOut}
      variant="outline"
      size={size}
      className={cn(className)}
    >
      Disconnect
    </Button>
  )
}