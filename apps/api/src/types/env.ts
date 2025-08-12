const required = [
  'API_PORT',
  'API_HOST',
  'DATABASE_URL'
] as const;

export function getEnv() {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
  return {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    API_PORT: Number(process.env.API_PORT ?? 3000),
    API_HOST: process.env.API_HOST ?? '0.0.0.0',
    API_CORS_ORIGIN: process.env.API_CORS_ORIGIN ?? '*',
    DOMAIN: process.env.DOMAIN ?? 'localhost'
  };
}
