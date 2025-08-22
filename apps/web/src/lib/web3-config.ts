import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import type { Config } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'

// Define the chains your app will work with (testnet only for now)
export const chains = [sepolia] as const

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

// API endpoints - ensure they always point to the backend API
// Force the use of external backend API URL for auth endpoints
const API_BASE_URL = 'https://orenna-backend-production.up.railway.app'

export const API_ENDPOINTS = {
  NONCE: `${API_BASE_URL}/api/auth/siwe/nonce`,
  VERIFY: `${API_BASE_URL}/api/auth/siwe/verify`, 
  SESSION: `${API_BASE_URL}/api/auth/session`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
} as const

// Server-safe basic config for SSR
function createServerConfig(): Config {
  return createConfig({
    chains,
    transports: {
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

// Simplified client config - disable WalletConnect for now to avoid initialization issues
function createClientConfig(): Config {
  try {
    console.log('Creating wagmi config with NODE_ENV:', process.env.NODE_ENV);
    
    // Always use simple config to avoid WalletConnect initialization issues
    return createConfig({
      chains,
      transports: {
        [sepolia.id]: http(),
      },
      connectors: [
        injected({ 
          shimDisconnect: false,
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

// Create the config directly without global state
export function getOrCreateConfig(): Config {
  return getConfig()
}

declare module 'wagmi' {
  interface Register {
    config: Config
  }
}