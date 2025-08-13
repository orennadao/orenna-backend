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
    API_PORT: Number(process.env.API_PORT ?? 3001), // Changed to 3001
    API_HOST: process.env.API_HOST ?? '0.0.0.0',
    API_CORS_ORIGIN: process.env.API_CORS_ORIGIN ?? '*',
    JWT_SECRET: process.env.JWT_SECRET!,
    
    // SIWE Configuration
    SIWE_DOMAIN: process.env.SIWE_DOMAIN ?? 'localhost:3000',
    SIWE_ORIGIN: process.env.SIWE_ORIGIN ?? 'http://localhost:3000',
    SIWE_SESSION_TTL: process.env.SIWE_SESSION_TTL ?? '604800',
  };
}