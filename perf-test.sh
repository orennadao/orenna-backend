#!/bin/bash

# Performance Test Script
# Tests response times for key endpoints with p95 < 300ms requirement

echo "🚀 Performance Testing Canary Deployment"
echo "Target: p95 < 300ms for all endpoints"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint performance
test_endpoint() {
    local url=$1
    local name=$2
    local num_requests=100
    
    echo -e "\n${BLUE}Testing: $name${NC}"
    echo "URL: $url"
    echo "Requests: $num_requests"
    
    # Create temporary file for response times
    temp_file=$(mktemp)
    
    # Run performance test
    for i in $(seq 1 $num_requests); do
        time_total=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>/dev/null)
        echo "$time_total" >> "$temp_file"
    done
    
    # Calculate statistics (convert to milliseconds)
    times_ms=$(awk '{print $1 * 1000}' "$temp_file" | sort -n)
    
    # Calculate percentiles
    p50=$(echo "$times_ms" | awk 'NR==int(NF*0.5){print}' | head -1)
    p90=$(echo "$times_ms" | awk 'NR==int(NF*0.9){print}' | head -1)
    p95=$(echo "$times_ms" | awk 'NR==int(NF*0.95){print}' | head -1)
    p99=$(echo "$times_ms" | awk 'NR==int(NF*0.99){print}' | head -1)
    avg=$(echo "$times_ms" | awk '{sum+=$1} END {print sum/NR}')
    
    # Clean up
    rm "$temp_file"
    
    # Display results
    printf "  Average: %.2f ms\n" "$avg"
    printf "  p50:     %.2f ms\n" "$p50"
    printf "  p90:     %.2f ms\n" "$p90"
    printf "  p95:     %.2f ms\n" "$p95"
    printf "  p99:     %.2f ms\n" "$p99"
    
    # Check if p95 meets requirement
    if (( $(echo "$p95 < 300" | bc -l) )); then
        echo -e "  ${GREEN}✅ PASS - p95 (${p95}ms) < 300ms${NC}"
        return 0
    else
        echo -e "  ${RED}❌ FAIL - p95 (${p95}ms) >= 300ms${NC}"
        return 1
    fi
}

# Test endpoints
failed_tests=0

# Test /health (load balancer endpoint)
test_endpoint "http://localhost:8080/health" "/health (Load Balancer)" || ((failed_tests++))

# Test /health/liveness (API endpoint)
test_endpoint "http://localhost:8080/health/liveness" "/health/liveness" || ((failed_tests++))

# Test /health/readiness (API endpoint)
test_endpoint "http://localhost:8080/health/readiness" "/health/readiness" || ((failed_tests++))

# Test a simple API endpoint
test_endpoint "http://localhost:8080/api/indexer/status" "/api/indexer/status" || ((failed_tests++))

# Summary
echo -e "\n${BLUE}=========================================="
echo "Performance Test Summary"
echo "==========================================${NC}"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "All endpoints meet the p95 < 300ms requirement"
else
    echo -e "${RED}❌ $failed_tests TEST(S) FAILED${NC}"
    echo -e "Some endpoints exceed the 300ms p95 requirement"
fi

echo -e "\n${BLUE}Service Information:${NC}"
echo "  Main Service:     http://localhost:3001"
echo "  Canary Service:   http://localhost:3002" 
echo "  Load Balancer:    http://localhost:8080"
echo "  Traffic Split:    90/10 (main/canary)"

exit $failed_tests