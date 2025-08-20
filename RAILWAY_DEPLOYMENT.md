# Railway Deployment Guide

This guide walks you through deploying the Orenna API to Railway.

## Prerequisites

1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account
3. PostgreSQL database (can be provisioned through Railway)

## Quick Start

### 1. Login to Railway
```bash
railway login
```

### 2. Create a New Project
```bash
railway new
```
Select "Deploy from GitHub repo" and connect your repository.

### 3. Add PostgreSQL Database
```bash
railway add --database postgresql
```

### 4. Set Environment Variables
Use the `railway-env.example` file as a template. Set each variable:

```bash
# Required variables
railway variables set API_PORT=3001
railway variables set API_HOST=0.0.0.0
railway variables set JWT_SECRET=your-secure-jwt-secret

# Database URL will be automatically set by Railway's PostgreSQL service
# but you can override if using external database:
# railway variables set DATABASE_URL=your-database-url

# CORS settings
railway variables set API_CORS_ORIGIN=https://your-frontend-domain.com
railway variables set API_BASE_URL=https://your-railway-app.railway.app
```

### 5. Deploy
```bash
railway up
```

## Database Setup

### Run Migrations
After deployment, you'll need to run database migrations:

```bash
# Connect to your Railway project
railway link

# Run migrations
railway run pnpm --filter @orenna/db prisma:migrate
```

### Generate Prisma Client
The Prisma client is generated during the build process, but if you need to regenerate:

```bash
railway run pnpm --filter @orenna/db prisma:generate
```

## Configuration Files

- `railway.dockerfile` - Optimized Dockerfile for Railway deployment
- `railway.json` - Railway deployment configuration
- `railway-env.example` - Template for environment variables

## Important Environment Variables

### Required
- `API_PORT` - Port for the API server (3001)
- `API_HOST` - Host binding (0.0.0.0 for Railway)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing

### Blockchain
- `DEFAULT_CHAIN_ID` - Default blockchain network
- `RPC_URL_*` - RPC endpoints for different networks
- Contract addresses for your deployed contracts

### Security
- Private keys for contract interactions (store securely!)
- CORS origins
- Rate limiting settings

## Health Checks

The API includes a health check endpoint at `/health` that Railway will use to monitor your deployment.

## Monitoring

Enable monitoring by setting:
- `METRICS_ENABLED=true`
- `LOG_LEVEL=info`
- `SENTRY_DSN=your-sentry-dsn` (optional)

## Troubleshooting

### Build Issues
- Check that all dependencies are properly listed in package.json
- Ensure Prisma client generation succeeds
- Verify TypeScript compilation

### Runtime Issues
- Check Railway logs: `railway logs`
- Verify environment variables are set correctly
- Test database connectivity

### Database Issues
- Ensure migrations have been run
- Check DATABASE_URL format
- Verify network connectivity to database

## Scaling

Railway automatically handles scaling, but you can configure:
- Memory limits
- CPU allocation
- Replica count (Pro plans)

## Custom Domains

To use a custom domain:
1. Go to your Railway project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Update CORS and SIWE settings accordingly