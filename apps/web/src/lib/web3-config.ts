import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import type { Config } from 'wagmi'

// Define the chains your app will work with
export const chains = [mainnet, sepolia] as const

// Server-safe basic config for SSR
function createServerConfig(): Config {
  return createConfig({
    chains,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    connectors: [
      injected({ shimDisconnect: true }),
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
          injected({ shimDisconnect: true }),
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
                url: 'https://orenna.org',
                icons: ['https://orenna.org/logo.png'],
              },
            }),
            injected({ shimDisconnect: true }),
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