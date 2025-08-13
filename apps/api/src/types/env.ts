const required = [
  'API_PORT',
  'API_HOST',
  'DATABASE_URL',
  'JWT_SECRET'
] as const;

export function getEnv() {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
  return {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    API_PORT: Number(process.env.API_PORT ?? 3001),
    API_HOST: process.env.API_HOST ?? '0.0.0.0',
    API_CORS_ORIGIN: process.env.API_CORS_ORIGIN ?? '*',
    JWT_SECRET: process.env.JWT_SECRET!,
    
    // SIWE Configuration
    SIWE_DOMAIN: process.env.SIWE_DOMAIN ?? 'localhost:3000',
    SIWE_ORIGIN: process.env.SIWE_ORIGIN ?? 'http://localhost:3000',
    SIWE_SESSION_TTL: process.env.SIWE_SESSION_TTL ?? '604800',
    
    // Blockchain Configuration
    DEFAULT_CHAIN_ID: Number(process.env.DEFAULT_CHAIN_ID ?? 1), // Ethereum mainnet
    RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
    RPC_URL_SEPOLIA: process.env.RPC_URL_SEPOLIA,
    RPC_URL_POLYGON: process.env.RPC_URL_POLYGON,
    RPC_URL_ARBITRUM: process.env.RPC_URL_ARBITRUM,
    
    // Contract Addresses
    ORNA_TOKEN_ADDRESS: process.env.ORNA_TOKEN_ADDRESS,
    LIFT_UNITS_ADDRESS: process.env.LIFT_UNITS_ADDRESS,
    
    // Private keys for contract interactions (use with caution)
    MINTER_PRIVATE_KEY: process.env.MINTER_PRIVATE_KEY,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
  };
}

export type Env = ReturnType<typeof getEnv>;
