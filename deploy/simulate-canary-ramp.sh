#!/bin/bash

# Orenna Canary Ramp Simulation
# Demonstrates the canary ramp process for 50% → 100% over 15 minutes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TOTAL_DURATION=900  # 15 minutes in seconds
PHASE1_DURATION=450  # 7.5 minutes to reach 50%
PHASE2_DURATION=450  # 7.5 minutes to reach 100%
CHECK_INTERVAL=30   # Check every 30 seconds
START_TIME=$(date +%s)

echo -e "${BLUE}🚀 Orenna Canary Ramp Simulation${NC}"
echo -e "${BLUE}Demonstrating gradual ramp: 10% → 50% → 100% over 15 minutes${NC}"
echo -e "${BLUE}Start time: $(date)${NC}"
echo ""

# Function to log with timestamp
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[$timestamp] INFO:${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp] WARN:${NC} $message" ;;
        "ERROR") echo -e "${RED}[$timestamp] ERROR:${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp] SUCCESS:${NC} $message" ;;
    esac
}

# Function to simulate rollback snapshot creation
simulate_snapshot_creation() {
    log "INFO" "🛡️  Creating rollback snapshots (simulated)..."
    
    # Simulate database snapshot
    log "INFO" "Creating database snapshot..."
    sleep 2
    log "SUCCESS" "Database snapshot created: rollback_snapshot_20250815_190000.sql (45MB)"
    
    # Simulate nginx config backup
    log "INFO" "Backing up nginx configuration..."
    sleep 1
    log "SUCCESS" "Nginx config backed up to: nginx.conf.backup.1692143610"
    
    # Simulate Docker image backup
    log "INFO" "Capturing Docker image state..."
    sleep 1
    log "SUCCESS" "Docker image state captured: docker_images_backup_20250815_190000.txt"
    
    log "SUCCESS" "All rollback snapshots created successfully"
    echo ""
}

# Function to simulate traffic split update
simulate_traffic_update() {
    local canary_weight=$1
    local main_weight=$((100 - canary_weight))
    
    log "INFO" "Updating traffic split: Main=${main_weight}%, Canary=${canary_weight}%"
    
    # Simulate nginx configuration update
    cat > nginx_simulation.conf << EOF
# Simulated nginx configuration
upstream backend {
    # Main service - ${main_weight}% traffic
    server orenna-api-main:3001 weight=${main_weight};
    
    # Canary service - ${canary_weight}% traffic  
    server orenna-api-canary:3002 weight=${canary_weight};
}
EOF
    
    # Simulate nginx reload
    sleep 1
    log "SUCCESS" "Traffic split updated successfully"
    return 0
}

# Function to simulate health monitoring
simulate_health_check() {
    local phase=$1
    local current_percent=$2
    
    # Simulate random health status with increasing stability
    local error_chance=5  # 5% chance of error
    
    # Reduce error chance as we progress
    if [ $current_percent -gt 75 ]; then
        error_chance=1  # Very stable at high percentages
    elif [ $current_percent -gt 50 ]; then
        error_chance=3  # More stable past 50%
    fi
    
    local random=$((RANDOM % 100))
    
    if [ $random -lt $error_chance ]; then
        log "WARN" "Transient health check warning (simulated)"
        return 0  # Don't fail on warnings
    else
        log "INFO" "Health check passed - All services healthy"
        return 0
    fi
}

# Function to calculate elapsed time
get_elapsed_time() {
    local current_time=$(date +%s)
    echo $((current_time - START_TIME))
}

# Function to display progress
show_progress() {
    local current_percent=$1
    local phase=$2
    local elapsed=$(get_elapsed_time)
    local remaining=$((TOTAL_DURATION - elapsed))
    
    echo ""
    echo -e "${PURPLE}📊 Ramp Progress - Phase $phase${NC}"
    echo -e "  Current Traffic Split: Main=$((100-current_percent))%, Canary=${current_percent}%"
    echo -e "  Elapsed Time: ${elapsed}s / ${TOTAL_DURATION}s"
    echo -e "  Remaining Time: ${remaining}s"
    echo -e "  Progress: $(( (elapsed * 100) / TOTAL_DURATION ))%"
    echo ""
}

# Function to simulate metrics collection
show_metrics() {
    local phase=$1
    local current_percent=$2
    
    echo -e "${BLUE}📈 Live Metrics (simulated):${NC}"
    echo -e "  Main Service Response Time: $((120 + RANDOM % 50))ms"
    echo -e "  Canary Service Response Time: $((110 + RANDOM % 40))ms"
    echo -e "  Error Rate: 0.0$((RANDOM % 5))%"
    echo -e "  Requests/sec: $((450 + RANDOM % 100))"
    echo ""
}

# Main simulation function
main() {
    log "INFO" "🎯 Starting Canary Ramp Simulation"
    
    # Create rollback snapshots
    simulate_snapshot_creation
    
    # Initial health check
    log "INFO" "Performing initial health check..."
    simulate_health_check "initial" 10
    
    log "INFO" "🎯 Starting Phase 1: Ramp to 50% over 7.5 minutes..."
    echo ""
    
    # Phase 1: Ramp from 10% to 50% over 7.5 minutes
    local current_percent=10
    local target_percent=50
    local phase1_steps=15  # 30 second intervals for 7.5 minutes
    local increment=$(( (target_percent - current_percent) / phase1_steps ))
    
    for ((i=1; i<=phase1_steps; i++)); do
        current_percent=$((10 + (increment * i)))
        
        # Update traffic split
        simulate_traffic_update $current_percent
        
        # Show progress
        show_progress $current_percent 1
        
        # Show metrics
        show_metrics 1 $current_percent
        
        # Health check
        simulate_health_check "phase1" $current_percent
        
        if [ $i -lt $phase1_steps ]; then
            log "INFO" "Waiting ${CHECK_INTERVAL}s before next increment..."
            sleep 3  # Shortened for simulation
        fi
    done
    
    log "SUCCESS" "✅ Phase 1 completed: 50% traffic to canary"
    echo ""
    
    log "INFO" "🎯 Starting Phase 2: Ramp to 100% over 7.5 minutes..."
    echo ""
    
    # Phase 2: Ramp from 50% to 100% over 7.5 minutes
    current_percent=50
    target_percent=100
    local phase2_steps=15  # 30 second intervals for 7.5 minutes
    increment=$(( (target_percent - current_percent) / phase2_steps ))
    
    for ((i=1; i<=phase2_steps; i++)); do
        current_percent=$((50 + (increment * i)))
        
        # Update traffic split
        simulate_traffic_update $current_percent
        
        # Show progress
        show_progress $current_percent 2
        
        # Show metrics
        show_metrics 2 $current_percent
        
        # Health check
        simulate_health_check "phase2" $current_percent
        
        if [ $i -lt $phase2_steps ]; then
            log "INFO" "Waiting ${CHECK_INTERVAL}s before next increment..."
            sleep 3  # Shortened for simulation
        fi
    done
    
    log "SUCCESS" "✅ Phase 2 completed: 100% traffic to canary"
    echo ""
    
    # Final promotion
    log "INFO" "🔄 Final step: Promoting canary to main service..."
    sleep 2
    log "SUCCESS" "Main service updated to canary image"
    
    # Reset traffic distribution
    simulate_traffic_update 0
    log "SUCCESS" "Traffic reset to 100% main (now running canary image)"
    
    # Final health check
    log "INFO" "Performing final health verification..."
    sleep 2
    simulate_health_check "final" 100
    
    # Calculate total time
    local total_time=$(get_elapsed_time)
    
    echo ""
    log "SUCCESS" "🎉 CANARY RAMP COMPLETED SUCCESSFULLY!"
    echo ""
    echo -e "${GREEN}✅ Deployment Summary:${NC}"
    echo -e "  Total Time: ${total_time} seconds (simulated 15 minutes)"
    echo -e "  Traffic Progression: 10% → 50% → 100%"
    echo -e "  Health Checks: All passed"
    echo -e "  Rollback Capability: Available for 24 hours"
    echo ""
    echo -e "${BLUE}📁 Rollback Assets Created:${NC}"
    echo -e "  📸 Database snapshot: rollback_snapshot_20250815_190000.sql"
    echo -e "  🐳 Docker image backup: docker_images_backup_20250815_190000.txt"
    echo -e "  ⚙️  Nginx config backup: nginx.conf.backup.1692143610"
    echo ""
    echo -e "${YELLOW}📖 Emergency Rollback:${NC}"
    echo -e "  Run: ./deploy/rollback-emergency.sh"
    echo -e "  Or use: ./deploy/create-rollback-snapshot.sh"
    echo ""
    echo -e "${PURPLE}🔍 Monitoring:${NC}"
    echo -e "  Watch: ./deploy/monitor-canary.sh --watch"
    echo -e "  Health: curl http://localhost:80/health"
    echo -e "  Logs: docker-compose -f docker-compose.prod.yml logs -f"
    
    return 0
}

# Show startup info
echo -e "${YELLOW}⚠️  CANARY RAMP SIMULATION${NC}"
echo -e "${YELLOW}This simulates a gradual canary deployment over 15 minutes${NC}"
echo -e "${YELLOW}In production, this would create real snapshots and route traffic${NC}"
echo ""
read -p "$(echo -e "${YELLOW}Start simulation? (y/N):${NC} ")" -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Simulation cancelled."
    exit 0
fi

# Execute simulation
main

echo ""
echo -e "${GREEN}🎉 Canary ramp simulation completed successfully!${NC}"
echo -e "${GREEN}Ready for production deployment with rollback safety net.${NC}"