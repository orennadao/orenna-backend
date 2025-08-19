'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { getOrCreateConfig } from '@/lib/web3-config'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Always get a config - this handles both SSR and client
  const config = getOrCreateConfig()

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}