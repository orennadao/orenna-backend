'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSiweAuth } from '@/hooks/use-siwe-auth'
import { useAccount } from 'wagmi'
import { ConnectWalletModal } from './connect-wallet-modal'
import { cn } from '@/lib/utils'

interface WalletConnectButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
}

export function WalletConnectButton({ className, size = 'sm', children }: WalletConnectButtonProps = {}) {
  const { user, isAuthenticated, signOut, isAuthenticating } = useSiweAuth()
  const { address, isConnected } = useAccount()
  
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
          size={size}
          className={cn(className)}
        >
          Sign Out
        </Button>
      </div>
    )
  }

  // Default: Show connect button that opens modal
  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={isAuthenticating}
        variant="outline"
        size={size}
        className={cn(className)}
      >
        {isAuthenticating ? 'Connecting...' : (children || 'Connect Wallet')}
      </Button>
      
      <ConnectWalletModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}