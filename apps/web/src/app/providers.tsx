"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  RainbowKitSiweNextAuthProvider,
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

  return (
    <WagmiProvider config={config}>
      <SessionProvider 
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider
            signInOptions={{ provider: "siwe", redirect: false, callbackUrl: "/" }}
          >
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}