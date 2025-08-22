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
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setIsClient(true)
      const wagmiConfig = getOrCreateConfig()
      setConfig(wagmiConfig)
    } catch (err) {
      console.error('Failed to initialize wagmi config:', err)
      setError('Failed to initialize Web3 connection')
    }
  }, [])

  // Show error state if config failed to load
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Web3 initialization failed</p>
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

  // Show loading until config is ready
  if (!isClient || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Web3...</p>
        </div>
      </div>
    )
  }

  // Render with proper error boundary
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={wagmiQueryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}