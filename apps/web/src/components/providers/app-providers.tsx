'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GovernanceProvider } from './governance-provider';
import { Web3Provider } from './web3-provider';
import { WebSocketProvider } from './websocket-provider';
import { useState, useEffect } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSG/SSR, don't render providers that cause context issues
  if (!isClient) {
    return <>{children}</>;
  }
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'status' in error) {
                const status = error.status as number;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  if (!isClient) {
    // Render children without context providers during SSR/SSG
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <WebSocketProvider>
          <GovernanceProvider>
            {children}
          </GovernanceProvider>
        </WebSocketProvider>
      </Web3Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}