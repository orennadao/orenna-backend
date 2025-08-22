'use client'

import { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

interface Web3ProviderMinimalProps {
  children: ReactNode
}

// Minimal wagmi config to test initialization
const minimalConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [
    injected({ 
      shimDisconnect: false,
    }),
  ],
})

// Create a separate query client for wagmi
const wagmiQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 3,
    },
  },
})

export function Web3ProviderMinimal({ children }: Web3ProviderMinimalProps) {
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setIsClient(true)
      console.log('Web3Provider minimal initialized successfully')
    } catch (err) {
      console.error('Failed to initialize minimal Web3Provider:', err)
      setError('Failed to initialize Web3 connection')
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Web3 initialization failed: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Web3...</p>
        </div>
      </div>
    )
  }

  return (
    <WagmiProvider config={minimalConfig}>
      <QueryClientProvider client={wagmiQueryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}