"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { WalletConnectButton } from "@/components/auth/wallet-connect-button";
import { AuthStatus } from "@/components/auth/auth-status";

// Move navItems outside component to ensure consistency
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/payments", label: "Payments" },
  { href: "/projects", label: "Projects" },
  { href: "/lift-tokens", label: "Lift Tokens" },
  { href: "/mint-requests", label: "Mint Requests" },
  { href: "/blockchain", label: "ORNA" },
] as const;

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Orenna DAO
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <AuthStatus />
            <WalletConnectButton />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="py-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 px-4 space-y-3">
                <div className="flex flex-col space-y-2">
                  <AuthStatus />
                  <WalletConnectButton />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}