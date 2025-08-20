const required = [
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
    API_PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
    API_HOST: process.env.API_HOST ?? '0.0.0.0',
    API_CORS_ORIGIN: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:3001',
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
    
    // Escrow Contract Addresses
    REPAYMENT_ESCROW_ADDRESS: process.env.REPAYMENT_ESCROW_ADDRESS,
    ALLOCATION_ESCROW_ADDRESS: process.env.ALLOCATION_ESCROW_ADDRESS,
    
    // Platform Configuration
    PLATFORM_TREASURY_ADDRESS: process.env.PLATFORM_TREASURY_ADDRESS,
    PLATFORM_FEE_BPS: Number(process.env.PLATFORM_FEE_BPS ?? 250), // 2.5% default
    PLATFORM_FEE_CAP: process.env.PLATFORM_FEE_CAP ?? '1000000000000000000', // 1 ETH default
    
    // Private keys for contract interactions (use with caution)
    MINTER_PRIVATE_KEY: process.env.MINTER_PRIVATE_KEY,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    PAYMENT_PROCESSOR_PRIVATE_KEY: process.env.PAYMENT_PROCESSOR_PRIVATE_KEY,
    
    // Payment Configuration
    PAYMENT_CONFIRMATION_BLOCKS: Number(process.env.PAYMENT_CONFIRMATION_BLOCKS ?? 12),
    PAYMENT_TIMEOUT_MINUTES: Number(process.env.PAYMENT_TIMEOUT_MINUTES ?? 30),
    
    // Indexer Configuration
    INDEXER_ENABLED: process.env.INDEXER_ENABLED === 'true',
    INDEXER_START_BLOCK_MAINNET: Number(process.env.INDEXER_START_BLOCK_MAINNET ?? 18000000),
    INDEXER_START_BLOCK_SEPOLIA: Number(process.env.INDEXER_START_BLOCK_SEPOLIA ?? 4000000),
    INDEXER_BATCH_SIZE: Number(process.env.INDEXER_BATCH_SIZE ?? 1000),
    INDEXER_POLL_INTERVAL: Number(process.env.INDEXER_POLL_INTERVAL ?? 30000), // 30 seconds
    INDEXER_CONFIRMATION_BLOCKS: Number(process.env.INDEXER_CONFIRMATION_BLOCKS ?? 12),
    
    // Notification Configuration
    EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    WEBHOOK_NOTIFICATIONS_ENABLED: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
    PUSH_NOTIFICATIONS_ENABLED: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    
    // Email Service Configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS ?? 'noreply@orenna.com',
    
    // Webhook Configuration
    WEBHOOK_NOTIFICATION_URLS: process.env.WEBHOOK_NOTIFICATION_URLS,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    
    // Push Notification Configuration
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
    
    // External Payment Providers
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    COINBASE_API_KEY: process.env.COINBASE_API_KEY,
    COINBASE_WEBHOOK_SECRET: process.env.COINBASE_WEBHOOK_SECRET,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
    
    // Monitoring and Logging
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
    SENTRY_DSN: process.env.SENTRY_DSN,
    METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
  };
}

export type Env = ReturnType<typeof getEnv>;
