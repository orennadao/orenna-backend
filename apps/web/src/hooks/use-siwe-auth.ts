'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { SIWE_CONFIG, API_ENDPOINTS } from '@/lib/web3-config';
import { useRouter } from 'next/navigation';

interface User {
  id?: number;
  address: string;
  chainId: number;
  ensName?: string;
  roles?: {
    projectRoles: string[];
    systemRoles: string[];
  };
}

interface SiweAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSiweAuth() {
  const router = useRouter();
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [state, setState] = useState<SiweAuthState>({
    user: null,
    isAuthenticated: false,
    isAuthenticating: false,
    isLoading: true,
    error: null,
  });

  // Check existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Clear auth state when wallet disconnects
  useEffect(() => {
    if (!isConnected && state.isAuthenticated) {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: null,
      }));
    }
  }, [isConnected, state.isAuthenticated]);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  const signIn = useCallback(async () => {
    if (!address || !chainId || !isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Please connect your wallet first',
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      // Step 1: Get nonce from server
      const nonceResponse = await fetch(API_ENDPOINTS.NONCE, {
        method: 'GET',
        credentials: 'include',
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: SIWE_CONFIG.domain,
        address,
        statement: SIWE_CONFIG.statement,
        uri: SIWE_CONFIG.origin,
        version: SIWE_CONFIG.version,
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const messageString = message.prepareMessage();

      // Step 3: Sign the message
      const signature = await signMessageAsync({
        message: messageString,
      });

      // Step 4: Verify signature with server
      const verifyResponse = await fetch(API_ENDPOINTS.VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: messageString,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Authentication failed');
      }

      const userData = await verifyResponse.json();

      // Step 5: Update state with authenticated user
      setState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isAuthenticating: false,
      }));

      // Check if user needs onboarding
      if (userData.isNewUser) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }

      return true;
    } catch (error: any) {
      console.error('SIWE authentication failed:', error);
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: error.message || 'Authentication failed',
      }));
      return false;
    }
  }, [address, chainId, isConnected, signMessageAsync, router]);

  const signOut = useCallback(async () => {
    try {
      // Call logout endpoint
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local state and disconnect wallet
      setState({
        user: null,
        isAuthenticated: false,
        isAuthenticating: false,
        isLoading: false,
        error: null,
      });
      disconnect();
    }
  }, [disconnect]);

  return {
    ...state,
    signIn,
    signOut,
    refetch: checkSession,
  };
}