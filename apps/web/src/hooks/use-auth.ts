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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Check localStorage for existing auth state
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const authState = localStorage.getItem('test_auth_state');
        if (authState === 'authenticated') {
          setIsAuthenticated(true);
          setUser({
            id: 1,
            address: '0x1234567890123456789012345678901234567890',
            name: 'Test User',
            roles: {
              projectRoles: ['PROJECT_MANAGER'],
              systemRoles: ['VERIFIER'],
            }
          });
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkAuthState();
  }, []);

  const signIn = async () => {
    setIsAuthenticating(true);
    try {
      // Simulate auth process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('test_auth_state', 'authenticated');
      setIsAuthenticated(true);
      setUser({
        id: 1,
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test User',
        roles: {
          projectRoles: ['PROJECT_MANAGER'],
          systemRoles: ['VERIFIER'],
        }
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('test_auth_state');
      // Also clear terms acceptance to allow testing full onboarding
      localStorage.removeItem('orenna_terms_accepted');
      localStorage.removeItem('orenna_terms_version');
      localStorage.removeItem('orenna_terms_accepted_timestamp');
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated,
    isConnected: isAuthenticated, // For testing, connected = authenticated
    signIn,
    signOut,
  }
}