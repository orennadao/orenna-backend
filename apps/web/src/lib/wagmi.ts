import { http } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, polygon, arbitrum, optimism, sepolia } from "wagmi/chains";

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID)?.trim();
const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim();

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID or NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable");
}

if (!sepoliaRpcUrl) {
  console.error("Missing NEXT_PUBLIC_SEPOLIA_RPC_URL environment variable");
}

export const config = getDefaultConfig({
  appName: "Orenna DAO",
  projectId: projectId || "2f5a2b4c1d8e3f9a6b7c8d9e0f1a2b3c", // Fallback ID - replace with valid one
  chains: [sepolia], // Start with Sepolia only as per current setup
  ssr: true,
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl || "https://sepolia.infura.io/v3/"), // Fallback to public endpoint
  },
});