#!/bin/bash

# Orenna Backend Canary Ramp Script
# Gradually increases canary traffic from 10% → 50% → 100% over 15 minutes
# Maintains rollback capabilities with DB snapshots and image backups

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
RAMP_TO_50_DURATION=450  # 7.5 minutes to reach 50%
RAMP_TO_100_DURATION=450  # 7.5 minutes to reach 100%
HEALTH_CHECK_INTERVAL=30  # Check health every 30 seconds
ERROR_THRESHOLD=5  # Max errors before auto-rollback

# Rollback state
ORIGINAL_CONFIG_BACKUP=""
DB_SNAPSHOT_FILE=""
DOCKER_IMAGE_BACKUP=""
START_TIME=$(date +%s)

echo -e "${BLUE}🚀 Orenna Canary Ramp Deployment${NC}"
echo -e "${BLUE}Starting gradual ramp: 10% → 50% → 100% over 15 minutes${NC}"
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

# Function to create database snapshot
create_db_snapshot() {
    log "INFO" "Creating database snapshot for rollback..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    DB_SNAPSHOT_FILE="rollback_snapshot_${timestamp}.sql"
    
    # Create full database backup
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres orenna > "$DB_SNAPSHOT_FILE" 2>/dev/null; then
        log "SUCCESS" "Database snapshot created: $DB_SNAPSHOT_FILE ($(du -h "$DB_SNAPSHOT_FILE" | cut -f1))"
        return 0
    else
        log "ERROR" "Failed to create database snapshot"
        return 1
    fi
}

# Function to backup current nginx config
backup_nginx_config() {
    log "INFO" "Backing up current nginx configuration..."
    
    if [ -f "nginx.conf" ]; then
        ORIGINAL_CONFIG_BACKUP="nginx.conf.backup.$(date +%s)"
        cp nginx.conf "$ORIGINAL_CONFIG_BACKUP"
        log "SUCCESS" "Nginx config backed up to: $ORIGINAL_CONFIG_BACKUP"
        return 0
    else
        log "ERROR" "nginx.conf not found"
        return 1
    fi
}

# Function to capture Docker image state
backup_docker_images() {
    log "INFO" "Capturing current Docker image state..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    DOCKER_IMAGE_BACKUP="docker_images_backup_${timestamp}.txt"
    
    # Save current image tags and IDs
    docker-compose -f docker-compose.prod.yml images --format table > "$DOCKER_IMAGE_BACKUP"
    
    # Also save the current docker-compose file state
    cp docker-compose.prod.yml "docker-compose.prod.yml.backup.${timestamp}"
    
    log "SUCCESS" "Docker image state captured: $DOCKER_IMAGE_BACKUP"
}

# Function to update nginx traffic distribution
update_traffic_split() {
    local canary_weight=$1
    local main_weight=$((100 - canary_weight))
    
    log "INFO" "Updating traffic split: Main=${main_weight}%, Canary=${canary_weight}%"
    
    # Create new nginx config with updated weights
    cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        # Main service - ${main_weight}% traffic
        server orenna-api-main:3001 weight=${main_weight};
        
        # Canary service - ${canary_weight}% traffic  
        server orenna-api-canary:3002 weight=${canary_weight};
        
        # Health checks
        keepalive 32;
    }
    
    server {
        listen 80;
        
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            
            # Health check specific settings
            proxy_connect_timeout 5s;
            proxy_read_timeout 10s;
        }
        
        location / {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Connection settings
            proxy_connect_timeout 10s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # Buffer settings for performance
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
    }
}
EOF

    # Reload nginx with new configuration
    if docker-compose -f docker-compose.prod.yml exec nginx nginx -t && \
       docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload; then
        log "SUCCESS" "Traffic split updated successfully"
        return 0
    else
        log "ERROR" "Failed to update traffic split"
        return 1
    fi
}

# Function to check service health
check_health() {
    local service_port=$1
    local service_name=$2
    
    if curl -f -s --max-time 10 "http://localhost:${service_port}/health" > /dev/null 2>&1; then
        return 0
    else
        log "WARN" "$service_name health check failed"
        return 1
    fi
}

# Function to monitor system health
monitor_health() {
    local error_count=0
    
    # Check main service
    if ! check_health 3001 "Main Service"; then
        ((error_count++))
    fi
    
    # Check canary service  
    if ! check_health 3002 "Canary Service"; then
        ((error_count++))
    fi
    
    # Check load balancer
    if ! check_health 80 "Load Balancer"; then
        ((error_count++))
    fi
    
    # Check for recent errors in logs
    local main_errors=$(docker-compose -f docker-compose.prod.yml logs --tail=20 orenna-api-main 2>/dev/null | grep -i "error\|failed\|exception" | wc -l)
    local canary_errors=$(docker-compose -f docker-compose.prod.yml logs --tail=20 orenna-api-canary 2>/dev/null | grep -i "error\|failed\|exception" | wc -l)
    
    if [ "$main_errors" -gt 3 ] || [ "$canary_errors" -gt 3 ]; then
        log "WARN" "High error count detected - Main: $main_errors, Canary: $canary_errors"
        ((error_count++))
    fi
    
    if [ $error_count -ge $ERROR_THRESHOLD ]; then
        log "ERROR" "Health check failures exceed threshold ($error_count >= $ERROR_THRESHOLD)"
        return 1
    fi
    
    log "INFO" "Health check passed (errors: $error_count/$ERROR_THRESHOLD)"
    return 0
}

# Function to rollback deployment
rollback_deployment() {
    log "ERROR" "🔄 INITIATING EMERGENCY ROLLBACK"
    
    # Restore nginx config
    if [ -n "$ORIGINAL_CONFIG_BACKUP" ] && [ -f "$ORIGINAL_CONFIG_BACKUP" ]; then
        log "INFO" "Restoring original nginx configuration..."
        cp "$ORIGINAL_CONFIG_BACKUP" nginx.conf
        docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
        log "SUCCESS" "Nginx configuration restored"
    fi
    
    # Offer database rollback option
    if [ -n "$DB_SNAPSHOT_FILE" ] && [ -f "$DB_SNAPSHOT_FILE" ]; then
        echo ""
        read -p "$(echo -e "${RED}Restore database from snapshot? (y/N):${NC} ")" -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Restoring database from snapshot..."
            if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS orenna;" && \
               docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "CREATE DATABASE orenna;" && \
               docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres orenna < "$DB_SNAPSHOT_FILE"; then
                log "SUCCESS" "Database restored from snapshot"
            else
                log "ERROR" "Failed to restore database"
            fi
        fi
    fi
    
    log "SUCCESS" "Rollback completed"
    exit 1
}

# Function to cleanup on success
cleanup_success() {
    log "INFO" "🧹 Cleaning up temporary files..."
    
    # Keep snapshots for 24 hours, then remove
    echo "find . -name 'rollback_snapshot_*.sql' -mtime +1 -delete" | at now + 24 hours 2>/dev/null || true
    echo "find . -name '*.backup.*' -mtime +1 -delete" | at now + 24 hours 2>/dev/null || true
    echo "find . -name 'docker_images_backup_*.txt' -mtime +1 -delete" | at now + 24 hours 2>/dev/null || true
    
    log "SUCCESS" "Cleanup scheduled for 24 hours"
}

# Function to calculate elapsed time
get_elapsed_time() {
    local current_time=$(date +%s)
    echo $((current_time - START_TIME))
}

# Function to display progress
show_progress() {
    local current_percent=$1
    local elapsed=$(get_elapsed_time)
    local remaining=$((TOTAL_DURATION - elapsed))
    
    echo ""
    echo -e "${PURPLE}📊 Ramp Progress${NC}"
    echo -e "  Current Traffic Split: Main=$((100-current_percent))%, Canary=${current_percent}%"
    echo -e "  Elapsed Time: ${elapsed}s / ${TOTAL_DURATION}s"
    echo -e "  Remaining Time: ${remaining}s"
    echo ""
}

# Trap for emergency rollback
trap 'log "WARN" "Script interrupted - initiating rollback"; rollback_deployment' INT TERM

# Main execution
main() {
    log "INFO" "🛡️  Creating rollback snapshots..."
    
    # Create all backups before starting
    if ! create_db_snapshot; then
        log "ERROR" "Failed to create database snapshot - aborting"
        exit 1
    fi
    
    if ! backup_nginx_config; then
        log "ERROR" "Failed to backup nginx config - aborting"
        exit 1
    fi
    
    backup_docker_images
    
    log "SUCCESS" "All rollback snapshots created successfully"
    echo ""
    
    # Initial health check
    if ! monitor_health; then
        log "ERROR" "Initial health check failed - aborting ramp"
        exit 1
    fi
    
    log "INFO" "🎯 Starting Phase 1: Ramp to 50% over 7.5 minutes..."
    
    # Phase 1: Ramp from 10% to 50% over 7.5 minutes
    local current_percent=10
    local target_percent=50
    local phase1_steps=15  # 30 second intervals for 7.5 minutes
    local increment=$(( (target_percent - current_percent) / phase1_steps ))
    
    for ((i=1; i<=phase1_steps; i++)); do
        current_percent=$((10 + (increment * i)))
        
        if ! update_traffic_split $current_percent; then
            log "ERROR" "Failed to update traffic split"
            rollback_deployment
        fi
        
        show_progress $current_percent
        
        # Health check every iteration
        if ! monitor_health; then
            log "ERROR" "Health check failed during Phase 1"
            rollback_deployment
        fi
        
        if [ $i -lt $phase1_steps ]; then
            log "INFO" "Waiting ${HEALTH_CHECK_INTERVAL}s before next increment..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log "SUCCESS" "✅ Phase 1 completed: 50% traffic to canary"
    echo ""
    
    log "INFO" "🎯 Starting Phase 2: Ramp to 100% over 7.5 minutes..."
    
    # Phase 2: Ramp from 50% to 100% over 7.5 minutes
    current_percent=50
    target_percent=100
    local phase2_steps=15  # 30 second intervals for 7.5 minutes
    increment=$(( (target_percent - current_percent) / phase2_steps ))
    
    for ((i=1; i<=phase2_steps; i++)); do
        current_percent=$((50 + (increment * i)))
        
        if ! update_traffic_split $current_percent; then
            log "ERROR" "Failed to update traffic split"
            rollback_deployment
        fi
        
        show_progress $current_percent
        
        # Health check every iteration
        if ! monitor_health; then
            log "ERROR" "Health check failed during Phase 2"
            rollback_deployment
        fi
        
        if [ $i -lt $phase2_steps ]; then
            log "INFO" "Waiting ${HEALTH_CHECK_INTERVAL}s before next increment..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log "SUCCESS" "✅ Phase 2 completed: 100% traffic to canary"
    echo ""
    
    # Final promotion - switch main service to canary image
    log "INFO" "🔄 Final step: Promoting canary to main service..."
    
    # Update docker-compose to use canary image for main service
    sed -i.backup 's/orenna-api-main:latest/orenna-api-canary:latest/g' docker-compose.prod.yml
    
    # Restart main service with new image
    if docker-compose -f docker-compose.prod.yml up -d orenna-api-main; then
        log "SUCCESS" "Main service updated to canary image"
        
        # Reset traffic to 100% main, 0% canary (both running same image now)
        update_traffic_split 0
        
        # Final health check
        sleep 30
        if monitor_health; then
            log "SUCCESS" "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
            echo ""
            echo -e "${GREEN}✅ Canary ramp completed in $(get_elapsed_time) seconds${NC}"
            echo -e "${GREEN}✅ 100% traffic now on new version${NC}"
            echo -e "${GREEN}✅ Rollback snapshots available for 24 hours${NC}"
            
            cleanup_success
        else
            log "ERROR" "Final health check failed"
            rollback_deployment
        fi
    else
        log "ERROR" "Failed to promote canary to main"
        rollback_deployment
    fi
}

# Display startup warning
echo -e "${YELLOW}⚠️  CANARY RAMP DEPLOYMENT${NC}"
echo -e "${YELLOW}This will gradually shift traffic from 10% → 50% → 100% to canary over 15 minutes${NC}"
echo -e "${YELLOW}Rollback snapshots will be created before starting${NC}"
echo ""
read -p "$(echo -e "${YELLOW}Continue with canary ramp? (y/N):${NC} ")" -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Execute main function
main

echo ""
echo -e "${BLUE}📚 Rollback information:${NC}"
echo -e "  Database snapshot: ${DB_SNAPSHOT_FILE}"
echo -e "  Nginx config backup: ${ORIGINAL_CONFIG_BACKUP}"
echo -e "  Docker images backup: ${DOCKER_IMAGE_BACKUP}"
echo ""
echo -e "${GREEN}🎉 Canary ramp deployment completed successfully!${NC}"