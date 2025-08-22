'use client'

import { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getOrCreateConfig } from '@/lib/web3-config'

interface Web3ProviderProps {
  children: ReactNode
}

// Create a separate query client for wagmi to avoid conflicts
const wagmiQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    },
  },
})

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
      <QueryClientProvider client={wagmiQueryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}