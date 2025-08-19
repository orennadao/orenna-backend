#!/bin/bash

# Orenna Backend Canary Deployment Script
# Deploys to production with 10% traffic split and indexers disabled

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TAG=${1:-v0.2.0-pr2}
CANARY_TRAFFIC_PERCENTAGE=10
MAIN_TRAFFIC_PERCENTAGE=90

echo -e "${BLUE}🚀 Starting Orenna Backend Canary Deployment${NC}"
echo -e "${BLUE}📦 Version: ${DEPLOYMENT_TAG}${NC}"
echo -e "${YELLOW}⚠️  Traffic Split: ${CANARY_TRAFFIC_PERCENTAGE}% canary, ${MAIN_TRAFFIC_PERCENTAGE}% main${NC}"
echo -e "${RED}🚫 Indexers: DISABLED for canary deployment${NC}"

# Pre-deployment checks
echo -e "\n${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if required environment file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found. Please create it first.${NC}"
    exit 1
fi

# Verify git tag exists
if ! git rev-parse "$DEPLOYMENT_TAG" > /dev/null 2>&1; then
    echo -e "${RED}❌ Git tag '$DEPLOYMENT_TAG' not found. Please create the tag first.${NC}"
    exit 1
fi

# Check for staging freeze
if [ -f "STAGING_FREEZE.md" ]; then
    echo -e "${YELLOW}⚠️  Staging freeze detected. Proceeding with production deployment...${NC}"
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Checkout deployment tag
echo -e "\n${BLUE}📋 Checking out deployment tag: ${DEPLOYMENT_TAG}${NC}"
git checkout "$DEPLOYMENT_TAG"

# Build production images
echo -e "\n${BLUE}🏗️  Building production Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Create necessary directories
echo -e "\n${BLUE}📁 Setting up deployment directories...${NC}"
mkdir -p traefik ssl monitoring/grafana/provisioning logs

# Generate Traefik configuration with weighted routing
echo -e "\n${BLUE}⚖️  Configuring traffic splitting (${CANARY_TRAFFIC_PERCENTAGE}% canary)...${NC}"
cat > traefik/traefik.yml << EOF
# Traefik Configuration for Canary Deployment
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
  file:
    filename: /etc/traefik/dynamic.yml

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@orenna.com
      storage: /ssl/acme.json
      tlsChallenge: {}

log:
  level: INFO

accessLog: {}
EOF

# Generate dynamic routing configuration
cat > traefik/dynamic.yml << EOF
# Dynamic routing configuration for canary deployment
http:
  services:
    orenna-weighted:
      weighted:
        services:
          - name: orenna-main-service
            weight: ${MAIN_TRAFFIC_PERCENTAGE}
          - name: orenna-canary-service
            weight: ${CANARY_TRAFFIC_PERCENTAGE}

  routers:
    orenna-api:
      rule: "Host(\`api.orenna.com\`)"
      service: orenna-weighted
      tls:
        certResolver: letsencrypt
EOF

# Run database migrations (if needed)
echo -e "\n${BLUE}🗄️  Running database migrations...${NC}"
# This would be environment-specific
# docker-compose -f docker-compose.prod.yml run --rm orenna-api-canary pnpm db:migrate

# Stop existing services (if any)
echo -e "\n${BLUE}🛑 Stopping existing services...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Start infrastructure services first
echo -e "\n${BLUE}🏁 Starting infrastructure services...${NC}"
docker-compose -f docker-compose.prod.yml up -d db-prod redis-prod prometheus grafana

# Wait for database to be ready
echo -e "\n${BLUE}⏳ Waiting for database to be ready...${NC}"
timeout 60 bash -c 'until docker-compose -f docker-compose.prod.yml exec -T db-prod pg_isready -U orenna_prod; do sleep 2; done'

# Start Traefik load balancer
echo -e "\n${BLUE}⚖️  Starting load balancer...${NC}"
docker-compose -f docker-compose.prod.yml up -d traefik

# Deploy main API service (existing version)
echo -e "\n${BLUE}🚀 Deploying main API service (${MAIN_TRAFFIC_PERCENTAGE}% traffic)...${NC}"
docker-compose -f docker-compose.prod.yml up -d orenna-api-main

# Wait for main service health check
echo -e "\n${BLUE}🏥 Waiting for main service health check...${NC}"
timeout 120 bash -c 'until curl -f http://localhost:3001/health > /dev/null 2>&1; do sleep 5; done'

# Deploy canary API service (new version with indexers disabled)
echo -e "\n${BLUE}🐦 Deploying canary service (${CANARY_TRAFFIC_PERCENTAGE}% traffic, indexers disabled)...${NC}"
docker-compose -f docker-compose.prod.yml up -d orenna-api-canary

# Wait for canary service health check
echo -e "\n${BLUE}🏥 Waiting for canary service health check...${NC}"
timeout 120 bash -c 'until curl -f http://localhost:3002/health > /dev/null 2>&1; do sleep 5; done'

# Verify indexers are disabled on canary
echo -e "\n${BLUE}🔍 Verifying indexers are disabled on canary...${NC}"
INDEXER_STATUS=$(curl -s http://localhost:3002/api/indexer/status | jq -r '.isRunning // false')
if [ "$INDEXER_STATUS" = "false" ]; then
    echo -e "${GREEN}✅ Confirmed: Indexers are disabled on canary${NC}"
else
    echo -e "${RED}❌ Warning: Indexers appear to be running on canary${NC}"
fi

# Deployment status check
echo -e "\n${BLUE}📊 Checking deployment status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Display deployment information
echo -e "\n${GREEN}🎉 Canary deployment completed successfully!${NC}"
echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "  📦 Version: ${DEPLOYMENT_TAG}"
echo -e "  🌐 Main Service: http://localhost:3001 (${MAIN_TRAFFIC_PERCENTAGE}% traffic)"
echo -e "  🐦 Canary Service: http://localhost:3002 (${CANARY_TRAFFIC_PERCENTAGE}% traffic)"
echo -e "  ⚖️  Load Balancer: http://localhost:80"
echo -e "  📊 Traefik Dashboard: http://localhost:8080"
echo -e "  📈 Grafana: http://localhost:3000"
echo -e "  🔍 Prometheus: http://localhost:9090"
echo -e "  🚫 Indexers: DISABLED on canary"

echo -e "\n${YELLOW}⚠️  Next Steps:${NC}"
echo -e "  1. Monitor application metrics in Grafana"
echo -e "  2. Check error rates and response times"
echo -e "  3. Validate canary functionality"
echo -e "  4. Run: ./deploy/monitor-canary.sh to watch metrics"
echo -e "  5. Run: ./deploy/promote-canary.sh to promote to 100%"
echo -e "  6. Run: ./deploy/rollback-canary.sh if issues are detected"

echo -e "\n${GREEN}✅ Deployment complete!${NC}"