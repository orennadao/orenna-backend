'use client';

import { useAccount, useChainId } from 'wagmi';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { siweLogin } from '@/lib/siwe';
import { Loader2 } from 'lucide-react';

export function SiweButton() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!address || !chainId) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await siweLogin(address, chainId);
      // Success - NextAuth will handle the redirect/session
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error('SIWE login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSignIn}
        disabled={!address || !chainId || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in with Ethereum'
        )}
      </Button>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
          {error}
        </div>
      )}
      
      {!address && (
        <div className="text-sm text-gray-600">
          Connect your wallet first to sign in
        </div>
      )}
    </div>
  );
}