'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Provider } from './web3-provider';
import { WebSocketProvider } from './websocket-provider';
import { ServiceWorkerProvider } from './service-worker-provider';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time of 5 minutes for cached data
      staleTime: 5 * 60 * 1000,
      // Cache time of 10 minutes 
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay that increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect to avoid spam
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
      // Shorter retry delay for mutations
      retryDelay: 1000,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerProvider>
        <Web3Provider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </Web3Provider>
      </ServiceWorkerProvider>
    </QueryClientProvider>
  );
}