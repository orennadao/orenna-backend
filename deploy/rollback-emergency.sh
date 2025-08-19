#!/bin/bash

# Orenna Backend Emergency Rollback Script
# Fast rollback using pre-created snapshots

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SNAPSHOT_DIR="./snapshots"
ROLLBACK_LOG="rollback_$(date +%Y%m%d_%H%M%S).log"

echo -e "${RED}🚨 ORENNA EMERGENCY ROLLBACK${NC}"
echo -e "${RED}This will rollback the system to a previous snapshot${NC}"
echo ""

# Function to log with timestamp
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_line="[$timestamp] $level: $message"
    
    case $level in
        "INFO")  echo -e "${BLUE}$log_line${NC}" ;;
        "WARN")  echo -e "${YELLOW}$log_line${NC}" ;;
        "ERROR") echo -e "${RED}$log_line${NC}" ;;
        "SUCCESS") echo -e "${GREEN}$log_line${NC}" ;;
    esac
    
    # Also log to file
    echo "$log_line" >> "$ROLLBACK_LOG"
}

# Function to list available snapshots
list_snapshots() {
    log "INFO" "Available rollback snapshots:"
    echo ""
    
    if [ ! -d "$SNAPSHOT_DIR" ]; then
        log "ERROR" "No snapshots directory found at: $SNAPSHOT_DIR"
        return 1
    fi
    
    local snapshots=($(find "$SNAPSHOT_DIR" -name "*_MANIFEST.json" -exec basename {} \; | sed 's/_MANIFEST.json$//' | sort -r))
    
    if [ ${#snapshots[@]} -eq 0 ]; then
        log "ERROR" "No snapshots found in $SNAPSHOT_DIR"
        return 1
    fi
    
    echo -e "${PURPLE}📸 Available Snapshots:${NC}"
    for i in "${!snapshots[@]}"; do
        local snapshot="${snapshots[$i]}"
        local manifest="${SNAPSHOT_DIR}/${snapshot}_MANIFEST.json"
        
        if [ -f "$manifest" ]; then
            local created_at=$(jq -r '.created_at // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
            local git_commit=$(jq -r '.git_commit // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
            local git_commit_short=${git_commit:0:7}
            
            echo -e "  ${BLUE}$((i+1)).${NC} ${snapshot}"
            echo -e "     Created: ${created_at}"
            echo -e "     Commit: ${git_commit_short}"
            echo ""
        fi
    done
    
    return 0
}

# Function to select snapshot
select_snapshot() {
    local snapshots=($(find "$SNAPSHOT_DIR" -name "*_MANIFEST.json" -exec basename {} \; | sed 's/_MANIFEST.json$//' | sort -r))
    
    echo -e "${YELLOW}Select snapshot to rollback to:${NC}"
    read -p "Enter number (1-${#snapshots[@]}): " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#snapshots[@]}" ]; then
        SELECTED_SNAPSHOT="${snapshots[$((selection-1))]}"
        log "INFO" "Selected snapshot: $SELECTED_SNAPSHOT"
        return 0
    else
        log "ERROR" "Invalid selection"
        return 1
    fi
}

# Function to verify snapshot integrity
verify_snapshot() {
    local snapshot_id=$1
    log "INFO" "Verifying snapshot integrity: $snapshot_id"
    
    local required_files=(
        "${snapshot_id}_database.sql"
        "${snapshot_id}_docker-compose.yml"
        "${snapshot_id}_MANIFEST.json"
    )
    
    local missing_files=0
    for file in "${required_files[@]}"; do
        if [ ! -f "${SNAPSHOT_DIR}/${file}" ]; then
            log "ERROR" "Missing required file: $file"
            ((missing_files++))
        elif [ ! -s "${SNAPSHOT_DIR}/${file}" ]; then
            log "ERROR" "Empty required file: $file"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        log "SUCCESS" "Snapshot integrity verified"
        return 0
    else
        log "ERROR" "Snapshot integrity check failed ($missing_files missing/empty files)"
        return 1
    fi
}

# Function to stop current services
stop_services() {
    log "INFO" "Stopping current services..."
    
    if docker-compose -f docker-compose.prod.yml down; then
        log "SUCCESS" "Services stopped successfully"
        return 0
    else
        log "ERROR" "Failed to stop services"
        return 1
    fi
}

# Function to backup current state before rollback
backup_current_state() {
    log "INFO" "Creating backup of current state before rollback..."
    
    local backup_prefix="pre_rollback_$(date +%Y%m%d_%H%M%S)"
    local backup_dir="./snapshots/${backup_prefix}"
    mkdir -p "$backup_dir"
    
    # Backup current docker-compose
    if [ -f "docker-compose.prod.yml" ]; then
        cp docker-compose.prod.yml "${backup_dir}/docker-compose.prod.yml"
    fi
    
    # Backup current nginx config
    if [ -f "nginx.conf" ]; then
        cp nginx.conf "${backup_dir}/nginx.conf"
    fi
    
    # Save current container state
    docker-compose -f docker-compose.prod.yml ps --format table > "${backup_dir}/container_state.txt" 2>/dev/null || true
    
    log "SUCCESS" "Current state backed up to: $backup_dir"
    return 0
}

# Function to restore database
restore_database() {
    local snapshot_id=$1
    log "INFO" "Restoring database from snapshot..."
    
    # Start postgres service
    if ! docker-compose -f docker-compose.prod.yml up -d postgres; then
        log "ERROR" "Failed to start postgres service"
        return 1
    fi
    
    # Wait for postgres to be ready
    log "INFO" "Waiting for database to be ready..."
    local attempts=0
    while [ $attempts -lt 30 ]; do
        if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres >/dev/null 2>&1; then
            break
        fi
        sleep 2
        ((attempts++))
    done
    
    if [ $attempts -eq 30 ]; then
        log "ERROR" "Database failed to start within timeout"
        return 1
    fi
    
    # Drop and recreate database
    log "INFO" "Dropping current database..."
    if ! docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS orenna;" >/dev/null 2>&1; then
        log "ERROR" "Failed to drop current database"
        return 1
    fi
    
    log "INFO" "Creating fresh database..."
    if ! docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "CREATE DATABASE orenna;" >/dev/null 2>&1; then
        log "ERROR" "Failed to create database"
        return 1
    fi
    
    # Restore from snapshot
    log "INFO" "Restoring data from snapshot..."
    if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres orenna < "${SNAPSHOT_DIR}/${snapshot_id}_database.sql" >/dev/null 2>&1; then
        log "SUCCESS" "Database restored successfully"
        return 0
    else
        log "ERROR" "Failed to restore database from snapshot"
        return 1
    fi
}

# Function to restore configurations
restore_configurations() {
    local snapshot_id=$1
    log "INFO" "Restoring configuration files..."
    
    # Restore docker-compose configuration
    if [ -f "${SNAPSHOT_DIR}/${snapshot_id}_docker-compose.yml" ]; then
        cp "${SNAPSHOT_DIR}/${snapshot_id}_docker-compose.yml" docker-compose.prod.yml
        log "SUCCESS" "Docker-compose configuration restored"
    else
        log "WARN" "Docker-compose backup not found"
    fi
    
    # Restore nginx configuration
    if [ -d "${SNAPSHOT_DIR}/${snapshot_id}_configs" ]; then
        if [ -f "${SNAPSHOT_DIR}/${snapshot_id}_configs/nginx.conf" ]; then
            cp "${SNAPSHOT_DIR}/${snapshot_id}_configs/nginx.conf" nginx.conf
            log "SUCCESS" "Nginx configuration restored"
        fi
        
        if [ -f "${SNAPSHOT_DIR}/${snapshot_id}_configs/nginx-canary.conf" ]; then
            cp "${SNAPSHOT_DIR}/${snapshot_id}_configs/nginx-canary.conf" nginx-canary.conf
            log "SUCCESS" "Nginx canary configuration restored"
        fi
    else
        log "WARN" "Configuration backup directory not found"
    fi
    
    return 0
}

# Function to restart services
restart_services() {
    log "INFO" "Starting services with restored configuration..."
    
    if docker-compose -f docker-compose.prod.yml up -d; then
        log "SUCCESS" "Services started successfully"
        return 0
    else
        log "ERROR" "Failed to start services"
        return 1
    fi
}

# Function to verify rollback success
verify_rollback() {
    log "INFO" "Verifying rollback success..."
    
    # Wait for services to be ready
    sleep 30
    
    local health_checks=0
    local total_checks=3
    
    # Check main API
    if curl -f -s --max-time 10 "http://localhost:3001/health" >/dev/null 2>&1; then
        log "SUCCESS" "Main API health check passed"
        ((health_checks++))
    else
        log "ERROR" "Main API health check failed"
    fi
    
    # Check canary API
    if curl -f -s --max-time 10 "http://localhost:3002/health" >/dev/null 2>&1; then
        log "SUCCESS" "Canary API health check passed"
        ((health_checks++))
    else
        log "ERROR" "Canary API health check failed"
    fi
    
    # Check load balancer
    if curl -f -s --max-time 10 "http://localhost:80/health" >/dev/null 2>&1; then
        log "SUCCESS" "Load balancer health check passed"
        ((health_checks++))
    else
        log "ERROR" "Load balancer health check failed"
    fi
    
    # Check database connectivity
    if docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        log "SUCCESS" "Database connectivity verified"
    else
        log "ERROR" "Database connectivity check failed"
    fi
    
    if [ $health_checks -eq $total_checks ]; then
        log "SUCCESS" "All health checks passed"
        return 0
    else
        log "ERROR" "Some health checks failed ($health_checks/$total_checks passed)"
        return 1
    fi
}

# Function to show rollback summary
show_rollback_summary() {
    local snapshot_id=$1
    
    echo ""
    echo -e "${GREEN}🎉 ROLLBACK COMPLETED${NC}"
    echo ""
    echo -e "${BLUE}📊 Rollback Summary:${NC}"
    echo -e "  Snapshot Used: ${snapshot_id}"
    echo -e "  Rollback Time: $(date)"
    echo -e "  Log File: ${ROLLBACK_LOG}"
    echo ""
    echo -e "${YELLOW}📋 Post-Rollback Checklist:${NC}"
    echo -e "  ✅ Services restarted"
    echo -e "  ✅ Database restored"
    echo -e "  ✅ Configurations restored"
    echo -e "  ⏳ Monitor system for 15-30 minutes"
    echo -e "  ⏳ Verify critical functionality"
    echo -e "  ⏳ Check error logs for issues"
    echo ""
    echo -e "${PURPLE}🔍 Monitoring Commands:${NC}"
    echo -e "  Monitor: ./deploy/monitor-canary.sh --watch"
    echo -e "  Logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo -e "  Health: curl http://localhost:80/health"
    echo ""
}

# Function to show snapshot details
show_snapshot_details() {
    local snapshot_id=$1
    local manifest="${SNAPSHOT_DIR}/${snapshot_id}_MANIFEST.json"
    
    if [ -f "$manifest" ]; then
        echo -e "${BLUE}📸 Snapshot Details:${NC}"
        echo -e "  ID: ${snapshot_id}"
        
        local created_at=$(jq -r '.created_at // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
        local git_commit=$(jq -r '.git_commit // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
        local git_branch=$(jq -r '.git_branch // "unknown"' "$manifest" 2>/dev/null || echo "unknown")
        
        echo -e "  Created: ${created_at}"
        echo -e "  Git Branch: ${git_branch}"
        echo -e "  Git Commit: ${git_commit:0:7}"
        echo ""
    fi
}

# Main execution
main() {
    # Check for running services
    if docker-compose -f docker-compose.prod.yml ps --format table | grep -q "Up"; then
        echo -e "${YELLOW}⚠️  Services are currently running${NC}"
    fi
    
    # List available snapshots
    if ! list_snapshots; then
        exit 1
    fi
    
    # Select snapshot
    if ! select_snapshot; then
        exit 1
    fi
    
    # Show snapshot details
    show_snapshot_details "$SELECTED_SNAPSHOT"
    
    # Confirm rollback
    echo -e "${RED}⚠️  THIS WILL ROLLBACK THE SYSTEM TO THE SELECTED SNAPSHOT${NC}"
    echo -e "${RED}⚠️  CURRENT DATA AND CONFIGURATION WILL BE REPLACED${NC}"
    echo ""
    read -p "$(echo -e "${RED}Are you absolutely sure? Type 'ROLLBACK' to continue: ${NC}")" -r
    if [ "$REPLY" != "ROLLBACK" ]; then
        log "INFO" "Rollback cancelled by user"
        exit 0
    fi
    
    echo ""
    log "INFO" "🚨 STARTING EMERGENCY ROLLBACK"
    
    # Verify snapshot integrity
    if ! verify_snapshot "$SELECTED_SNAPSHOT"; then
        exit 1
    fi
    
    # Backup current state
    backup_current_state
    
    # Stop current services
    if ! stop_services; then
        log "ERROR" "Failed to stop services - aborting rollback"
        exit 1
    fi
    
    # Restore configurations
    if ! restore_configurations "$SELECTED_SNAPSHOT"; then
        log "ERROR" "Failed to restore configurations"
        exit 1
    fi
    
    # Restore database
    if ! restore_database "$SELECTED_SNAPSHOT"; then
        log "ERROR" "Failed to restore database"
        exit 1
    fi
    
    # Restart services
    if ! restart_services; then
        log "ERROR" "Failed to restart services"
        exit 1
    fi
    
    # Verify rollback success
    if ! verify_rollback; then
        log "ERROR" "Rollback verification failed - manual intervention required"
        exit 1
    fi
    
    # Show summary
    show_rollback_summary "$SELECTED_SNAPSHOT"
}

# Trap for cleanup
trap 'log "WARN" "Rollback interrupted - system may be in inconsistent state"' INT TERM

# Execute main function
main

echo -e "${GREEN}✅ Emergency rollback completed successfully${NC}"