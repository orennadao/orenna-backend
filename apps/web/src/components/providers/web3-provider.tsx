'use client'

import { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { getOrCreateConfig } from '@/lib/web3-config'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // During SSG/SSR, render children without Wagmi context to prevent errors
  if (!isClient) {
    return <>{children}</>
  }

  const config = getOrCreateConfig()

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}