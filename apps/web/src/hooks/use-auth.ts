'use client'

import { useState, useEffect } from 'react'

// Available roles in the system
export type FinanceRole = 'VENDOR' | 'PROJECT_MANAGER' | 'FINANCE_REVIEWER' | 'TREASURER' | 'DAO_MULTISIG';
export type SystemRoleType = 'PLATFORM_ADMIN' | 'VERIFIER';

interface User {
  id?: number;
  address?: string;
  email?: string;
  name?: string;
  chainId?: number;
  roles?: {
    projectRoles: FinanceRole[];
    systemRoles: SystemRoleType[];
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Simplified auth for testing - no wagmi dependencies
  const isAuthenticated = true
  const isConnected = true

  // Mock user with some roles for testing navigation
  useEffect(() => {
    setUser({
      id: 1,
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test User',
      roles: {
        projectRoles: ['PROJECT_MANAGER'],
        systemRoles: ['VERIFIER'],
      }
    });
  }, []);

  return {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    isConnected,
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  }
}