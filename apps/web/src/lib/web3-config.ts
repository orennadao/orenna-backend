import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import type { Config } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'

// Define the chains your app will work with (allowlist for security)
export const chains = [mainnet, sepolia] as const

// React Query client for wagmi
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    },
  },
})

// SIWE Configuration
export const SIWE_CONFIG = {
  domain: process.env.NEXT_PUBLIC_SIWE_DOMAIN || 'localhost:3000',
  origin: process.env.NEXT_PUBLIC_SIWE_ORIGIN || 'http://localhost:3000',
  statement: `Welcome to Orenna DAO!\n\nConnect your wallet to access regenerative finance projects, vote on governance proposals, and participate in ecological restoration.\n\nDomain: ${process.env.NEXT_PUBLIC_SIWE_DOMAIN || 'localhost:3000'}\n\nBy signing this message, you agree to our Terms of Service and Privacy Policy.`,
  version: '1',
  nonceTTL: 5 * 60 * 1000, // 5 minutes
  sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
} as const

// API endpoints
export const API_ENDPOINTS = {
  NONCE: '/api/auth/siwe/nonce',
  VERIFY: '/api/auth/siwe/verify', 
  SESSION: '/api/auth/session',
  LOGOUT: '/api/auth/logout',
} as const

// Server-safe basic config for SSR
function createServerConfig(): Config {
  return createConfig({
    chains,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    connectors: [
      injected({ 
        shimDisconnect: true,
      }),
    ],
    ssr: true,
  })
}

// Client config with full wallet support
function createClientConfig(): Config {
  try {
    // Get environment variables and clean them
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?.trim()

    if (!projectId) {
      console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set. WalletConnect and Coinbase Wallet will be disabled.')
      console.warn('To enable these features, get a project ID from https://cloud.walletconnect.com/')
      // Return basic config without WalletConnect
      return createConfig({
        chains,
        transports: {
          [mainnet.id]: http(),
          [sepolia.id]: http(),
        },
        connectors: [
          injected({ 
            shimDisconnect: true,
          }),
        ],
      })
    }

    return createConfig({
      chains,
      transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
      },
      connectors: process.env.NODE_ENV === 'development' 
        ? [
            // Development mode - only basic wallet connections to avoid third-party auth errors
            injected({ shimDisconnect: true }),
          ]
        : [
            // Production mode - full wallet support
            walletConnect({
              projectId,
              metadata: {
                name: 'Orenna DAO',
                description: 'Regenerative finance platform',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://orenna.org',
                icons: ['https://orenna.org/logo.png'],
              },
            }),
            injected({ 
              shimDisconnect: true,
            }),
            coinbaseWallet({
              appName: 'Orenna DAO',
              appLogoUrl: 'https://orenna.org/logo.png',
              preference: 'smartWalletOnly', // Reduce 401 metric errors
            }),
          ],
    })
  } catch (error) {
    console.error('Failed to create wagmi config:', error)
    return createServerConfig()
  }
}

// Create the appropriate config based on environment
export function getConfig(): Config {
  if (typeof window === 'undefined') {
    return createServerConfig()
  }
  return createClientConfig()
}

// Create the config lazily
let config: Config | null = null

export function getOrCreateConfig(): Config {
  if (!config) {
    config = getConfig()
  }
  return config
}

declare module 'wagmi' {
  interface Register {
    config: Config
  }
}