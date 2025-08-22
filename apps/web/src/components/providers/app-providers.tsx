'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GovernanceProvider } from './governance-provider';
import { Web3Provider } from './web3-provider';
import { WebSocketProvider } from './websocket-provider';
import { NoSSR } from './no-ssr';
import { useState } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
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

  return (
    <NoSSR fallback={<div>Loading...</div>}>
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
    </NoSSR>
  );
}