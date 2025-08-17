'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { user, isAuthenticated, signIn, signOut, isAuthenticating } = useAuth()
  
  const [showConnectors, setShowConnectors] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  // If wallet is connected but not authenticated
  if (isConnected && !isAuthenticated) {
    return (
      <Button
        onClick={signIn}
        disabled={isAuthenticating}
        variant="primary"
        size="sm"
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
          {user.ensName || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
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
          disabled={isPending}
          variant="outline"
          size="sm"
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        
        {showConnectors && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Connect a wallet</h3>
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => {
                      connect({ connector })
                      setShowConnectors(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {connector.name.slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-medium">{connector.name}</span>
                  </button>
                ))}
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
      onClick={() => disconnect()}
      variant="outline"
      size="sm"
    >
      Disconnect
    </Button>
  )
}