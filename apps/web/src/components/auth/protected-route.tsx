'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  allowGuest?: boolean // New prop to allow guest access
  guestMessage?: string
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  allowGuest = false,
  guestMessage = "This page requires authentication to access all features."
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

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
    // Allow guest access if specified
    if (allowGuest) {
      return (
        <div>
          {/* Guest notice banner - right-aligned to avoid sidebar overlap */}
          <div className="fixed top-4 right-4 z-40 max-w-md">
            <div className="bg-blue-50 border border-blue-400 rounded-lg p-4 shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Guest Mode:</strong> {guestMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {children}
        </div>
      )
    }

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
          <div className="space-y-3">
            <Link href="/auth">
              <Button className="w-full">
                Connect Wallet
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full">
                Browse as Guest
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}