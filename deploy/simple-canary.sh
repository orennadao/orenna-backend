#!/bin/bash

# Simple Canary Deployment Script
# Deploys canary service with indexers disabled

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Simple Canary Deployment${NC}"
echo -e "${RED}🚫 Indexers: DISABLED for canary${NC}"
echo -e "${YELLOW}⚠️  Traffic: 10% canary, 90% main (assuming main service running on port 3001)${NC}"

# Check if main service is running
echo -e "\n${BLUE}🔍 Checking if main service is available...${NC}"
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Main service detected on port 3001${NC}"
else
    echo -e "${YELLOW}⚠️  Main service not detected on port 3001. Continuing anyway...${NC}"
fi

# Build and start canary service
echo -e "\n${BLUE}🏗️  Building canary service...${NC}"
docker-compose -f docker-compose.canary.yml build --no-cache

echo -e "\n${BLUE}🐦 Starting canary service...${NC}"
docker-compose -f docker-compose.canary.yml up -d

# Wait for health check
echo -e "\n${BLUE}🏥 Waiting for canary health check...${NC}"
timeout 120 bash -c 'until curl -f http://localhost:3002/health > /dev/null 2>&1; do echo "Waiting..."; sleep 5; done'

# Verify indexers are disabled
echo -e "\n${BLUE}🔍 Verifying indexers are disabled...${NC}"
if curl -s http://localhost:3002/api/indexer/status 2>/dev/null | grep -q '"isRunning":false'; then
    echo -e "${GREEN}✅ Confirmed: Indexers are disabled on canary${NC}"
else
    echo -e "${RED}❌ Warning: Could not verify indexer status${NC}"
fi

# Show status
echo -e "\n${BLUE}📊 Deployment Status:${NC}"
docker-compose -f docker-compose.canary.yml ps

echo -e "\n${GREEN}🎉 Canary deployment completed!${NC}"
echo -e "\n${BLUE}📋 Service Information:${NC}"
echo -e "  🐦 Canary Service: http://localhost:3002"
echo -e "  ⚖️  Load Balancer: http://localhost:80 (if started)"
echo -e "  🔍 Status: docker-compose -f docker-compose.canary.yml ps"
echo -e "  📝 Logs: docker-compose -f docker-compose.canary.yml logs -f"

echo -e "\n${YELLOW}⚠️  To complete traffic splitting:${NC}"
echo -e "  1. Start nginx load balancer: docker-compose -f docker-compose.canary.yml up -d nginx-lb"
echo -e "  2. Ensure main service is running on port 3001"
echo -e "  3. Access via load balancer on port 80"
echo -e "  4. Monitor logs and metrics"

echo -e "\n${GREEN}✅ Canary ready for testing!${NC}"