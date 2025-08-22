// Use NextAuth session instead of custom SIWE
import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user ? {
      address: (session as any).address || session.user.id,
      ensName: null,
      roles: { projectRoles: [], systemRoles: [] }
    } : null,
    isAuthenticated: !!session,
    isAuthenticating: status === 'loading',
    isLoading: status === 'loading',
    error: null,
    signOut: async () => {
      const { signOut } = await import('next-auth/react');
      await signOut();
    },
    refetch: async () => {
      // NextAuth handles session refetching automatically
    }
  };
}

// Export the User interface from SIWE auth
export type User = {
  id?: number;
  address: string;
  chainId: number;
  ensName?: string;
  roles?: {
    projectRoles: string[];
    systemRoles: string[];
  };
};

// For backward compatibility, export common auth types
export type FinanceRole = 'VENDOR' | 'PROJECT_MANAGER' | 'FINANCE_REVIEWER' | 'TREASURER' | 'DAO_MULTISIG';
export type SystemRoleType = 'PLATFORM_ADMIN' | 'VERIFIER';