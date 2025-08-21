'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';
import { ClientOnly } from '@/components/auth/client-only';
import { OnboardingFlow } from '@/components/auth/onboarding-flow';
import { useTermsAcceptance } from '@/hooks/use-terms-acceptance';
import Link from 'next/link';

function AuthContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const { needsAcceptance, isLoading: termsLoading } = useTermsAcceptance();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading || termsLoading) {
    return (
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Authentication</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your wallet connection and authentication status
          </p>
        </div>

        {isAuthenticated ? (
          needsAcceptance ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Orenna!</h2>
                <p className="text-gray-600 mb-6">Complete the onboarding process to access your dashboard and start participating in ecological restoration.</p>
                
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 transition-colors font-medium"
                >
                  Start Onboarding
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Authenticated</h2>
                <p className="text-gray-600">Your wallet is connected and you are authenticated.</p>
              </div>

              <div className="space-y-4">
                <Link 
                  href="/auth/profile"
                  className="block w-full px-4 py-2 text-center bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  View Profile
                </Link>
                
                <Link 
                  href="/dashboard"
                  className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                To access the Orenna DAO platform, please connect your wallet using the button in the header.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How to Connect:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Click &quot;Connect Wallet&quot; in the header</li>
                <li>2. Choose your preferred wallet provider</li>
                <li>3. Sign the message to authenticate</li>
                <li>4. Start using the platform</li>
              </ol>
            </div>

            <div className="space-y-4">
              <Link 
                href="/"
                className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          // The page will automatically update to show the authenticated state
          // since needsAcceptance will become false after onboarding completion
        }}
        onClose={() => setShowOnboarding(false)}
      />
    </main>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ClientOnly 
        fallback={
          <main className="container mx-auto px-4 py-6 sm:py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </main>
        }
      >
        <AuthContent />
      </ClientOnly>
      <Footer />
    </div>
  );
}