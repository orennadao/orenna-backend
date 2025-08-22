import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected, metaMask } from 'wagmi/connectors'
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
      metaMask({ 
        dappMetadata: { name: 'Orenna DAO' }
      }),
    ],
    ssr: true,
  })
}

// Enhanced client config with multiple connectors for better browser support
function createClientConfig(): Config {
  try {
    console.log('Creating wagmi config with NODE_ENV:', process.env.NODE_ENV);
    
    const connectors = [
      // MetaMask connector for better compatibility (removed injected to prevent conflicts)
      metaMask({ 
        dappMetadata: { name: 'Orenna DAO' }
      }),
    ]
    
    // Add WalletConnect if project ID is available
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?.trim()
    if (walletConnectProjectId && walletConnectProjectId !== 'your_project_id_here') {
      console.log('WalletConnect Project ID:', JSON.stringify(walletConnectProjectId))
      connectors.push(
        walletConnect({ 
          projectId: walletConnectProjectId,
          metadata: {
            name: 'Orenna DAO',
            description: 'Regenerative Finance & Ecological Restoration',
            url: 'https://alpha.orennadao.com',
            icons: ['https://alpha.orennadao.com/favicon.ico']
          }
        })
      )
    }
    
    return createConfig({
      chains,
      transports: {
        [sepolia.id]: http(),
      },
      connectors,
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