'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WalletConnectButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
}

export function WalletConnectButton({ className, size = 'sm', children }: WalletConnectButtonProps = {}) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Render nothing on server-side
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

        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated')

        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              variant="outline"
              size={size}
              className={cn(className)}
            >
              {children || 'Connect Wallet'}
            </Button>
          )
        }

        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              variant="destructive"
              size={size}
              className={cn(className)}
            >
              Wrong network
            </Button>
          )
        }

        return (
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {account.ensName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
            </div>
            <Button
              onClick={openAccountModal}
              variant="outline"
              size={size}
              className={cn(className)}
            >
              Account
            </Button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}