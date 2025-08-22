"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { RainbowConnect } from "@/components/auth/rainbow-connect";
import { AuthStatus } from "@/components/auth/auth-status";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Orenna DAO
            </Link>
          </div>

          {/* Actions - Always visible */}
          <div className="flex items-center space-x-3">
            {!isAuthenticated && (
              <Link href="/projects">
                <Button variant="ghost" size="sm" aria-label="Browse projects as a guest">
                  Browse as Guest
                </Button>
              </Link>
            )}
            {isAuthenticated && <AuthStatus />}
            <RainbowConnect />
          </div>
        </div>
      </div>
    </header>
  );
}