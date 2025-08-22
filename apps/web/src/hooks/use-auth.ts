// Re-export SIWE auth as the main auth hook
export { useSiweAuth as useAuth } from './use-siwe-auth';

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