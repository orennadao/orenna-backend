'use client'

import { ReactNode, useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getOrCreateConfig } from '@/lib/web3-config'
import type { Config } from 'wagmi'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching
        refetchOnWindowFocus: false,
      },
    },
  }))
  
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    setMounted(true)
    const wagmiConfig = getOrCreateConfig()
    if (wagmiConfig) {
      setConfig(wagmiConfig)
    }
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  // If no config is available, render children without Web3 functionality
  if (!config) {
    console.warn('Web3 config not available - running without wallet functionality')
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}