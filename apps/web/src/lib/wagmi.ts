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
  projectId: projectId || "68b984bfdc6c2049e01d3cca4938e468", // Your actual WalletConnect project ID
  chains: [sepolia], // Start with Sepolia only as per current setup
  ssr: true,
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl || "https://sepolia.infura.io/v3/"), // Fallback to public endpoint
  },
});