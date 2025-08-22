'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../error-boundary';
import { NoSSR } from './no-ssr';
import { Web3Provider } from './web3-provider';
import { useState } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 3,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <NoSSR fallback={<div>Loading...</div>}>
        <QueryClientProvider client={queryClient}>
          <Web3Provider>
            {children}
          </Web3Provider>
        </QueryClientProvider>
      </NoSSR>
    </ErrorBoundary>
  );
}