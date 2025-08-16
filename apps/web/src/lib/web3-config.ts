import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import type { Config } from 'wagmi'

// Define the chains your app will work with
export const chains = [mainnet, sepolia] as const

// Lazy config creation function that only runs on client side
export function getConfig(): Config | null {
  // Only create config on client side
  if (typeof window === 'undefined') {
    return null
  }

  try {
    // Get environment variables
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

    if (!projectId) {
      console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set')
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
      connectors: [
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
        }),
      ],
    })
  } catch (error) {
    console.error('Failed to create wagmi config:', error)
    return null
  }
}

// Create the config lazily
let config: Config | null = null

export function getOrCreateConfig(): Config | null {
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