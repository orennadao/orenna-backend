import { signIn } from "next-auth/react";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";

/**
 * Custom SIWE authentication with CSRF token fallback
 */
export async function siweSignIn(
  address: string,
  chainId: number,
  signMessageAsync: (args: { message: string }) => Promise<string>
) {
  try {
    // Fetch CSRF token with no-store cache policy
    const { csrfToken } = await fetch("/api/auth/csrf", { 
      cache: "no-store",
      credentials: "same-origin" 
    }).then(r => r.json());

    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    // Create SIWE message
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to Orenna DAO",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce: csrfToken,
      issuedAt: new Date().toISOString(),
    });

    const messageString = message.prepareMessage();

    // Sign the message
    const signature = await signMessageAsync({ message: messageString });

    // Sign in with NextAuth, including CSRF token as fallback
    const result = await signIn("siwe", {
      message: JSON.stringify(message),
      signature,
      csrfToken, // Fallback if cookie isn't read
      callbackUrl: "/dashboard",
      redirect: false, // Handle redirect manually
    });

    return result;
  } catch (error) {
    console.error("SIWE sign-in error:", error);
    throw error;
  }
}

/**
 * Hook for SIWE authentication
 */
export function useSiweSignIn() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signIn = async () => {
    if (!address || !chainId || !signMessageAsync) {
      throw new Error("Wallet not connected");
    }

    return await siweSignIn(address, chainId, signMessageAsync);
  };

  return { signIn };
}