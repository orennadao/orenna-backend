#!/bin/bash

# Orenna Backend Canary Monitoring Script
# Monitors canary deployment metrics and health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Orenna Canary Deployment Monitor${NC}"
echo -e "${BLUE}Monitoring canary deployment health and metrics...${NC}"

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local url="http://localhost:${port}/health"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${service_name}: Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ ${service_name}: Unhealthy${NC}"
        return 1
    fi
}

# Function to get response time
get_response_time() {
    local url=$1
    local time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null || echo "0")
    echo "$time"
}

# Function to check indexer status
check_indexer_status() {
    local service_name=$1
    local port=$2
    local url="http://localhost:${port}/api/indexer/status"
    
    local status=$(curl -s "$url" 2>/dev/null | jq -r '.isRunning // "unknown"')
    
    if [ "$status" = "false" ]; then
        echo -e "${GREEN}✅ ${service_name}: Indexers disabled${NC}"
    elif [ "$status" = "true" ]; then
        echo -e "${RED}⚠️  ${service_name}: Indexers running${NC}"
    else
        echo -e "${YELLOW}❓ ${service_name}: Indexer status unknown${NC}"
    fi
}

# Function to display service metrics
display_metrics() {
    echo -e "\n${BLUE}📈 Service Metrics${NC}"
    echo "=================================="
    
    # Main service metrics
    echo -e "${BLUE}Main Service (90% traffic):${NC}"
    check_service_health "Main API" "3001"
    local main_response_time=$(get_response_time "http://localhost:3001/health")
    echo -e "  Response Time: ${main_response_time}s"
    check_indexer_status "Main API" "3001"
    
    echo ""
    
    # Canary service metrics
    echo -e "${BLUE}Canary Service (10% traffic):${NC}"
    check_service_health "Canary API" "3002"
    local canary_response_time=$(get_response_time "http://localhost:3002/health")
    echo -e "  Response Time: ${canary_response_time}s"
    check_indexer_status "Canary API" "3002"
    
    echo ""
    
    # Infrastructure services
    echo -e "${BLUE}Infrastructure:${NC}"
    check_service_health "Load Balancer" "80"
    check_service_health "Grafana" "3000"
    check_service_health "Prometheus" "9090"
}

# Function to check Docker container status
check_container_status() {
    echo -e "\n${BLUE}🐳 Container Status${NC}"
    echo "=================================="
    
    # Get container status
    docker-compose -f docker-compose.prod.yml ps --format table
}

# Function to check recent logs for errors
check_recent_errors() {
    echo -e "\n${BLUE}📝 Recent Error Analysis${NC}"
    echo "=================================="
    
    # Check for errors in canary logs (last 50 lines)
    echo -e "${BLUE}Canary Service Errors:${NC}"
    local canary_errors=$(docker-compose -f docker-compose.prod.yml logs --tail=50 orenna-api-canary 2>/dev/null | grep -i "error\|failed\|exception" | wc -l)
    if [ "$canary_errors" -gt 0 ]; then
        echo -e "${RED}❌ Found ${canary_errors} error(s) in canary logs${NC}"
        docker-compose -f docker-compose.prod.yml logs --tail=10 orenna-api-canary | grep -i "error\|failed\|exception" || echo "No recent errors found"
    else
        echo -e "${GREEN}✅ No errors found in recent canary logs${NC}"
    fi
    
    echo ""
    
    # Check for errors in main logs (last 50 lines)
    echo -e "${BLUE}Main Service Errors:${NC}"
    local main_errors=$(docker-compose -f docker-compose.prod.yml logs --tail=50 orenna-api-main 2>/dev/null | grep -i "error\|failed\|exception" | wc -l)
    if [ "$main_errors" -gt 0 ]; then
        echo -e "${RED}❌ Found ${main_errors} error(s) in main logs${NC}"
        docker-compose -f docker-compose.prod.yml logs --tail=10 orenna-api-main | grep -i "error\|failed\|exception" || echo "No recent errors found"
    else
        echo -e "${GREEN}✅ No errors found in recent main logs${NC}"
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "\n${BLUE}🔍 API Endpoint Testing${NC}"
    echo "=================================="
    
    # Test main service endpoints
    echo -e "${BLUE}Testing Main Service:${NC}"
    if curl -f -s "http://localhost:3001/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint: FAILED${NC}"
    fi
    
    # Test canary service endpoints  
    echo -e "${BLUE}Testing Canary Service:${NC}"
    if curl -f -s "http://localhost:3002/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint: FAILED${NC}"
    fi
    
    # Test load balancer
    echo -e "${BLUE}Testing Load Balancer:${NC}"
    if curl -f -s "http://localhost:80" > /dev/null; then
        echo -e "${GREEN}✅ Load balancer: OK${NC}"
    else
        echo -e "${RED}❌ Load balancer: FAILED${NC}"
    fi
}

# Function to show traffic distribution
show_traffic_stats() {
    echo -e "\n${BLUE}🌐 Traffic Distribution${NC}"
    echo "=================================="
    echo -e "Main Service:   90% of traffic"
    echo -e "Canary Service: 10% of traffic"
    echo -e ""
    echo -e "Monitor detailed traffic in Grafana: http://localhost:3000"
    echo -e "View load balancer metrics: http://localhost:8080"
}

# Main monitoring loop option
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    echo -e "${YELLOW}👀 Starting continuous monitoring (Ctrl+C to stop)...${NC}"
    
    while true; do
        clear
        echo -e "${BLUE}📊 Orenna Canary Monitoring - $(date)${NC}"
        echo "================================================================"
        
        display_metrics
        check_container_status
        show_traffic_stats
        
        echo -e "\n${YELLOW}⏳ Refreshing in 30 seconds... (Ctrl+C to stop)${NC}"
        sleep 30
    done
else
    # Single run monitoring
    display_metrics
    check_container_status
    check_recent_errors
    test_api_endpoints
    show_traffic_stats
    
    echo -e "\n${BLUE}💡 Tips:${NC}"
    echo -e "  • Run with --watch for continuous monitoring"
    echo -e "  • Check Grafana dashboards: http://localhost:3000"
    echo -e "  • View container logs: docker-compose -f docker-compose.prod.yml logs <service>"
    echo -e "  • Promote canary: ./deploy/promote-canary.sh"
    echo -e "  • Rollback if needed: ./deploy/rollback-canary.sh"
fi