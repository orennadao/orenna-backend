import { http } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, polygon, arbitrum, optimism, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Orenna DAO",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
  chains: [sepolia], // Start with Sepolia only as per current setup
  ssr: true,
  transports: {
    [sepolia.id]: http(),
  },
});