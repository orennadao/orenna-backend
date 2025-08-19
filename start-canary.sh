#!/bin/bash

# Start Canary Service with Indexers Disabled
echo "🐦 Starting Canary Service on port 3002 with indexers disabled..."

cd apps/api

# Export required environment variables from .env
export NODE_ENV=production
export API_PORT=3002
export API_HOST=0.0.0.0
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/orenna"
export JWT_SECRET=39a9ca7d3028f2425e4ef39644d57fde88135634b62c2eed24fe960fab1a2240

# 🚨 DISABLE INDEXERS FOR CANARY
export INDEXER_ENABLED=false

echo "✅ Environment configured:"
echo "   Port: $API_PORT"
echo "   Indexers: $INDEXER_ENABLED"

# Start the server
npx tsx src/server.ts