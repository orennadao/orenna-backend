#!/bin/bash

# Canary Deployment Verification Script

echo "🔍 Verifying Canary Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}1. Service Health Checks${NC}"
echo "   Main Service (Port 3001):"
if curl -f -s http://localhost:3001/health/liveness > /dev/null; then
    echo -e "   ${GREEN}✅ Main service is healthy${NC}"
else
    echo -e "   ${RED}❌ Main service is unhealthy${NC}"
fi

echo "   Canary Service (Port 3002):"
if curl -f -s http://localhost:3002/health/liveness > /dev/null; then
    echo -e "   ${GREEN}✅ Canary service is healthy${NC}"
else
    echo -e "   ${RED}❌ Canary service is unhealthy${NC}"
fi

echo "   Load Balancer (Port 8080):"
if curl -f -s http://localhost:8080/health > /dev/null; then
    echo -e "   ${GREEN}✅ Load balancer is healthy${NC}"
else
    echo -e "   ${RED}❌ Load balancer is unhealthy${NC}"
fi

echo -e "\n${BLUE}2. Indexer Status Verification${NC}"
echo "   Main Service Indexers:"
MAIN_INDEXER=$(curl -s http://localhost:3001/api/indexer/status | jq -r '.isRunning // "unknown"')
if [ "$MAIN_INDEXER" = "false" ]; then
    echo -e "   ${GREEN}✅ Main service indexers disabled${NC}"
else
    echo -e "   ${YELLOW}⚠️  Main service indexers: $MAIN_INDEXER${NC}"
fi

echo "   Canary Service Indexers:"
CANARY_INDEXER=$(curl -s http://localhost:3002/api/indexer/status | jq -r '.isRunning // "unknown"')
if [ "$CANARY_INDEXER" = "false" ]; then
    echo -e "   ${GREEN}✅ Canary service indexers disabled${NC}"
else
    echo -e "   ${RED}❌ Canary service indexers: $CANARY_INDEXER${NC}"
fi

echo -e "\n${BLUE}3. Traffic Distribution Test${NC}"
echo "   Testing 20 requests through load balancer..."

declare -A backend_counts
total_requests=20

for i in $(seq 1 $total_requests); do
    response=$(curl -s http://localhost:8080/health/liveness -D - | grep -i 'X-Backend-Server')
    if [[ $response =~ 127\.0\.0\.1:3001 ]]; then
        ((backend_counts[main]++))
    elif [[ $response =~ 127\.0\.0\.1:3002 ]]; then
        ((backend_counts[canary]++))
    fi
done

main_count=${backend_counts[main]:-0}
canary_count=${backend_counts[canary]:-0}
main_percent=$((main_count * 100 / total_requests))
canary_percent=$((canary_count * 100 / total_requests))

echo "   Results:"
echo -e "   Main Service:   $main_count/$total_requests requests (${main_percent}%)"
echo -e "   Canary Service: $canary_count/$total_requests requests (${canary_percent}%)"

if [ $canary_percent -ge 5 ] && [ $canary_percent -le 20 ]; then
    echo -e "   ${GREEN}✅ Traffic distribution is within expected range${NC}"
else
    echo -e "   ${YELLOW}⚠️  Traffic distribution may need adjustment${NC}"
fi

echo -e "\n${BLUE}4. Process Status${NC}"
echo "   Running processes:"
ps aux | grep -E "(tsx|nginx)" | grep -v grep | while read line; do
    echo "   $line"
done

echo -e "\n${BLUE}5. Network Ports${NC}"
echo "   Listening ports:"
lsof -i :3001 -i :3002 -i :8080 | grep LISTEN

echo -e "\n${GREEN}🎉 Canary Deployment Verification Complete!${NC}"
echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "   🌐 Main Service:     http://localhost:3001 (~90% traffic)"
echo -e "   🐦 Canary Service:   http://localhost:3002 (~10% traffic)"
echo -e "   ⚖️  Load Balancer:    http://localhost:8080"
echo -e "   🚫 Indexers:         DISABLED on both services"
echo -e "   📊 API Documentation: http://localhost:8080/docs"

echo -e "\n${YELLOW}⚠️  Next Steps:${NC}"
echo -e "   1. Monitor application metrics and error rates"
echo -e "   2. Validate canary functionality over time"
echo -e "   3. Check logs: tail -f /tmp/nginx-access.log"
echo -e "   4. If successful, promote canary to 100%"
echo -e "   5. If issues detected, rollback immediately"