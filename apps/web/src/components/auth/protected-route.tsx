'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { WalletConnectButton } from './wallet-connect-button'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { isConnected } = useAccount()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet and sign in to access this page.
          </p>
          
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Step 1: Connect your wallet
              </p>
              <WalletConnectButton />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Step 2: Sign the message to authenticate
              </p>
              <WalletConnectButton />
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}