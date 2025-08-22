"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
  GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { config } from "@/lib/wagmi";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient in state to prevent recreation on every render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  // Custom SIWE message configuration with explicit credentials
  const getSiweMessageOptions = (): GetSiweMessageOptions => ({
    statement: "Sign in to Orenna DAO to access regenerative finance projects, governance, and ecological restoration.",
  });

  return (
    <WagmiProvider config={config}>
      <SessionProvider 
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider
            getSiweMessageOptions={getSiweMessageOptions}
            signInOptions={{ 
              provider: "siwe", 
              redirect: false, 
              callbackUrl: "/dashboard"
            }}
          >
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}