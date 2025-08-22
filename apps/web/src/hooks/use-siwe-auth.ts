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
  const [mounted, setMounted] = useState(false);
  
  // Only access wagmi hooks after mount to avoid SSR issues
  const wagmiAccount = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  
  // Safe access to wagmi state
  const address = mounted ? wagmiAccount.address : undefined;
  const chainId = mounted ? wagmiAccount.chainId : undefined;
  const isConnected = mounted ? wagmiAccount.isConnected : false;

  const [state, setState] = useState<SiweAuthState>({
    user: null,
    isAuthenticated: false,
    isAuthenticating: false,
    isLoading: true,
    error: null,
  });
  
  // Handle mounting to prevent SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define checkSession function BEFORE using it in useEffect dependencies
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
        // 401 Unauthorized is expected when no session exists - don't log as error
        if (response.status !== 401) {
          console.warn(`Session check returned ${response.status}: ${response.statusText}`);
        }
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

  // Check existing session only after mount
  useEffect(() => {
    if (mounted) {
      checkSession();
    }
  }, [mounted, checkSession]);

  // Sync auth state with wallet connection state (only after mount)
  useEffect(() => {
    if (!mounted) return;
    
    if (!isConnected && state.isAuthenticated) {
      // Wallet disconnected but user still appears authenticated - clear auth state
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: null,
      }));
    } else if (isConnected && !state.isAuthenticated && !state.isAuthenticating && !state.isLoading) {
      // Wallet connected but no auth - this might be from a previous session
      // Check if we have a valid session
      checkSession();
    }
  }, [mounted, isConnected, state.isAuthenticated, state.isAuthenticating, state.isLoading, checkSession]);

  const signIn = useCallback(async () => {
    console.error('🚨 SIWE SIGN-IN FUNCTION CALLED!!! 🚨');
    console.error('Address:', address, 'ChainId:', chainId);
    
    if (!address || !chainId) {
      console.error('❌ Missing address or chainId');
      setState(prev => ({
        ...prev,
        error: 'Please connect your wallet first',
      }));
      return false;
    }
    
    // Sometimes isConnected lags behind address/chainId availability
    if (!isConnected) {
      console.log('Wallet not fully connected yet, waiting...');
      // Wait a moment for connection state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again - if still not connected, fail
      if (!isConnected) {
        setState(prev => ({
          ...prev,
          error: 'Wallet connection incomplete',
        }));
        return false;
      }
    }

    setState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      // Step 1: Get nonce from server
      console.error('🔑 FETCHING NONCE FROM:', API_ENDPOINTS.NONCE);
      const nonceResponse = await fetch(API_ENDPOINTS.NONCE, {
        method: 'GET',
        credentials: 'include',
      });

      console.error('📡 Nonce response status:', nonceResponse.status);
      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();
      console.error('✅ NONCE RECEIVED:', nonce);

      // Step 2: Create SIWE message
      console.log('📝 Creating SIWE message...');
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
      console.log('📄 SIWE message created:', messageString.slice(0, 100) + '...');

      // Step 3: Sign the message
      console.log('🖊️ Requesting signature from MetaMask...');
      const signature = await signMessageAsync({
        message: messageString,
      });
      console.log('✅ MetaMask signature received:', signature?.slice(0, 10) + '...');

      // Step 4: Verify signature with server
      console.log('📡 Sending verify request to:', API_ENDPOINTS.VERIFY);
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
      console.log('📡 Verify response status:', verifyResponse.status);

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
      console.error('❌ SIWE authentication failed:', error);
      console.error('❌ Error details:', error.message, error.stack);
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

  // Return safe state until mounted
  if (!mounted) {
    return {
      user: null,
      isAuthenticated: false,
      isAuthenticating: false,
      isLoading: true,
      error: null,
      signIn,
      signOut,
      refetch: checkSession,
    };
  }

  return {
    ...state,
    signIn,
    signOut,
    refetch: checkSession,
  };
}