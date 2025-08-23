'use client';
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { siweLogin } from '@/lib/siwe';
import { RainbowConnect } from '@/components/auth/rainbow-connect';

export default function Page() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [out, setOut] = useState<any>(null);
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">SIWE Debug Page</h1>
      <p className="text-gray-600">Test the complete SIWE authentication flow</p>
      
      <div className="flex items-center gap-4">
        <RainbowConnect />
        {!address && <span className="text-sm text-gray-500">← Connect wallet first</span>}
      </div>
      
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!address || !chainId}
        onClick={async () => {
          try {
            setOut({ status: 'signing...' });
            await siweLogin(address as `0x${string}`, chainId);
            
            setOut({ status: 'checking session...' });
            const me = await fetch('/api/auth/whoami', { cache: 'no-store' }).then(r => r.json());
            
            setOut({ ok: true, me });
          } catch (e: any) {
            setOut({ ok: false, error: e?.message || String(e) });
          }
        }}
      >
        Test SIWE Sign-in
      </button>
      
      <div className="space-y-2">
        <h2 className="font-semibold">Current State:</h2>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-w-full">
          {JSON.stringify({ address, chainId, out }, null, 2)}
        </pre>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Connect your wallet using RainbowKit</li>
          <li>Click "Test SIWE Sign-in" button</li>
          <li>Sign the message in MetaMask</li>
          <li>Check the output for your wallet address</li>
        </ol>
      </div>
    </div>
  );
}