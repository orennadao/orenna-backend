'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { getOrCreateConfig } from '@/lib/web3-config'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const config = getOrCreateConfig()

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}