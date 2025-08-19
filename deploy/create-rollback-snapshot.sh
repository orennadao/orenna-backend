#!/bin/bash

# Orenna Backend Rollback Snapshot Creator
# Creates comprehensive snapshots for emergency rollback capability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SNAPSHOT_DIR="./snapshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_PREFIX="orenna_rollback_${TIMESTAMP}"

echo -e "${BLUE}📸 Orenna Rollback Snapshot Creator${NC}"
echo -e "${BLUE}Creating comprehensive rollback snapshots...${NC}"
echo ""

# Create snapshots directory
mkdir -p "$SNAPSHOT_DIR"

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
create_database_snapshot() {
    log "INFO" "Creating database snapshot..."
    
    local db_snapshot="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_database.sql"
    local db_schema="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_schema.sql"
    
    # Create full database backup
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres orenna > "$db_snapshot" 2>/dev/null; then
        local size=$(du -h "$db_snapshot" | cut -f1)
        log "SUCCESS" "Database snapshot created: $db_snapshot ($size)"
    else
        log "ERROR" "Failed to create database snapshot"
        return 1
    fi
    
    # Create schema-only backup
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres --schema-only orenna > "$db_schema" 2>/dev/null; then
        local size=$(du -h "$db_schema" | cut -f1)
        log "SUCCESS" "Schema snapshot created: $db_schema ($size)"
    else
        log "WARN" "Failed to create schema snapshot"
    fi
    
    return 0
}

# Function to backup Docker images
backup_docker_images() {
    log "INFO" "Backing up Docker image information..."
    
    local image_list="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_images.txt"
    local compose_backup="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_docker-compose.yml"
    
    # Save current running images
    docker-compose -f docker-compose.prod.yml images --format table > "$image_list"
    
    # Add detailed image information
    echo "" >> "$image_list"
    echo "=== DETAILED IMAGE INFO ===" >> "$image_list"
    docker-compose -f docker-compose.prod.yml images --format "table {{.Service}}\t{{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" >> "$image_list"
    
    # Save current docker-compose configuration
    cp docker-compose.prod.yml "$compose_backup"
    
    log "SUCCESS" "Image backup created: $image_list"
    log "SUCCESS" "Compose backup created: $compose_backup"
    
    return 0
}

# Function to backup configuration files
backup_configurations() {
    log "INFO" "Backing up configuration files..."
    
    local config_dir="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_configs"
    mkdir -p "$config_dir"
    
    # Backup nginx configuration
    if [ -f "nginx.conf" ]; then
        cp nginx.conf "${config_dir}/nginx.conf"
        log "SUCCESS" "Nginx config backed up"
    fi
    
    # Backup nginx canary configuration
    if [ -f "nginx-canary.conf" ]; then
        cp nginx-canary.conf "${config_dir}/nginx-canary.conf"
        log "SUCCESS" "Nginx canary config backed up"
    fi
    
    # Backup environment files (without sensitive data)
    if [ -f ".env.example" ]; then
        cp .env.example "${config_dir}/.env.example"
    fi
    
    # Backup package configurations
    if [ -f "package.json" ]; then
        cp package.json "${config_dir}/package.json"
    fi
    
    if [ -f "pnpm-lock.yaml" ]; then
        cp pnpm-lock.yaml "${config_dir}/pnpm-lock.yaml"
    fi
    
    log "SUCCESS" "Configuration files backed up to: $config_dir"
    return 0
}

# Function to capture system state
capture_system_state() {
    log "INFO" "Capturing current system state..."
    
    local state_file="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_system_state.txt"
    
    cat > "$state_file" << EOF
=== ORENNA SYSTEM STATE SNAPSHOT ===
Created: $(date)
Snapshot ID: ${SNAPSHOT_PREFIX}

=== DOCKER CONTAINERS ===
$(docker-compose -f docker-compose.prod.yml ps --format table)

=== CONTAINER RESOURCE USAGE ===
$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}")

=== NGINX STATUS ===
$(docker-compose -f docker-compose.prod.yml exec nginx nginx -t 2>&1 || echo "Nginx test failed")

=== DATABASE STATUS ===
$(docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT version();" 2>/dev/null || echo "Database connection failed")

=== SERVICE HEALTH CHECKS ===
Main API (port 3001): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "FAILED")
Canary API (port 3002): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null || echo "FAILED")
Load Balancer (port 80): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "FAILED")

=== GIT STATUS ===
$(git status --porcelain 2>/dev/null || echo "Not a git repository")

Current Branch: $(git branch --show-current 2>/dev/null || echo "Unknown")
Last Commit: $(git log -1 --oneline 2>/dev/null || echo "No commits")

=== DISK USAGE ===
$(df -h | grep -E "(Filesystem|/dev/)")

=== NETWORK INTERFACES ===
$(ip addr show 2>/dev/null | grep -E "(inet |inet6 )" || ifconfig 2>/dev/null | grep -E "(inet |inet6 )" || echo "Network info unavailable")

EOF

    log "SUCCESS" "System state captured: $state_file"
    return 0
}

# Function to create rollback instructions
create_rollback_instructions() {
    log "INFO" "Creating rollback instructions..."
    
    local instructions="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_ROLLBACK_INSTRUCTIONS.md"
    
    cat > "$instructions" << EOF
# 🔄 Orenna Rollback Instructions

**Snapshot ID**: \`${SNAPSHOT_PREFIX}\`  
**Created**: $(date)  
**Purpose**: Emergency rollback capability for canary deployment

## 🚨 Emergency Rollback Procedure

### 1. Stop Current Deployment
\`\`\`bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Optional: Remove current containers
docker-compose -f docker-compose.prod.yml rm -f
\`\`\`

### 2. Restore Database (if needed)
\`\`\`bash
# Connect to database container
docker-compose -f docker-compose.prod.yml up -d postgres

# Drop current database and restore from snapshot
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS orenna;"
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "CREATE DATABASE orenna;"
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres orenna < ${SNAPSHOT_PREFIX}_database.sql
\`\`\`

### 3. Restore Configuration Files
\`\`\`bash
# Restore nginx configuration
cp ${SNAPSHOT_PREFIX}_configs/nginx.conf nginx.conf

# Restore docker-compose configuration
cp ${SNAPSHOT_PREFIX}_docker-compose.yml docker-compose.prod.yml
\`\`\`

### 4. Restart Services
\`\`\`bash
# Start all services with restored configuration
docker-compose -f docker-compose.prod.yml up -d

# Verify health
./deploy/monitor-canary.sh
\`\`\`

### 5. Verify Rollback Success
\`\`\`bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:80/health

# Check database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT COUNT(*) FROM \"User\";"
\`\`\`

## 📁 Snapshot Contents

- **Database**: \`${SNAPSHOT_PREFIX}_database.sql\` - Full database backup
- **Schema**: \`${SNAPSHOT_PREFIX}_schema.sql\` - Schema-only backup  
- **Images**: \`${SNAPSHOT_PREFIX}_images.txt\` - Docker image information
- **Configs**: \`${SNAPSHOT_PREFIX}_configs/\` - Configuration files
- **System State**: \`${SNAPSHOT_PREFIX}_system_state.txt\` - System snapshot
- **Docker Compose**: \`${SNAPSHOT_PREFIX}_docker-compose.yml\` - Service definitions

## ⚠️ Important Notes

1. **Test rollback procedure** in staging environment first if possible
2. **Notify team** before executing rollback
3. **Document issues** that led to rollback for post-mortem
4. **Verify data integrity** after database restore
5. **Monitor system** closely after rollback

## 📞 Emergency Contacts

- **Primary**: Check team communication channels
- **Escalation**: Follow incident response procedures
- **Database Issues**: Ensure database restore completed successfully

---
*Generated by Orenna Rollback Snapshot Creator*
EOF

    log "SUCCESS" "Rollback instructions created: $instructions"
    return 0
}

# Function to create snapshot manifest
create_snapshot_manifest() {
    log "INFO" "Creating snapshot manifest..."
    
    local manifest="${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_MANIFEST.json"
    
    cat > "$manifest" << EOF
{
  "snapshot_id": "${SNAPSHOT_PREFIX}",
  "created_at": "$(date -Iseconds)",
  "created_by": "$(whoami)",
  "purpose": "Canary deployment rollback snapshot",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "files": {
    "database_full": "${SNAPSHOT_PREFIX}_database.sql",
    "database_schema": "${SNAPSHOT_PREFIX}_schema.sql",
    "docker_images": "${SNAPSHOT_PREFIX}_images.txt",
    "docker_compose": "${SNAPSHOT_PREFIX}_docker-compose.yml",
    "system_state": "${SNAPSHOT_PREFIX}_system_state.txt",
    "configurations": "${SNAPSHOT_PREFIX}_configs/",
    "rollback_instructions": "${SNAPSHOT_PREFIX}_ROLLBACK_INSTRUCTIONS.md"
  },
  "services_status": {
    "main_api": "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo 'unknown')",
    "canary_api": "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null || echo 'unknown')",
    "load_balancer": "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo 'unknown')"
  },
  "retention": {
    "keep_until": "$(date -d '+7 days' -Iseconds 2>/dev/null || date -v+7d -Iseconds 2>/dev/null || echo 'unknown')",
    "auto_cleanup": true
  }
}
EOF

    log "SUCCESS" "Snapshot manifest created: $manifest"
    return 0
}

# Function to verify snapshot integrity
verify_snapshot() {
    log "INFO" "Verifying snapshot integrity..."
    
    local errors=0
    
    # Check database snapshot
    if [ ! -f "${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_database.sql" ]; then
        log "ERROR" "Database snapshot missing"
        ((errors++))
    elif [ ! -s "${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_database.sql" ]; then
        log "ERROR" "Database snapshot is empty"
        ((errors++))
    fi
    
    # Check configuration backups
    if [ ! -d "${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_configs" ]; then
        log "ERROR" "Configuration backup directory missing"
        ((errors++))
    fi
    
    # Check manifest
    if [ ! -f "${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_MANIFEST.json" ]; then
        log "ERROR" "Manifest file missing"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log "SUCCESS" "Snapshot integrity verification passed"
        return 0
    else
        log "ERROR" "Snapshot integrity verification failed ($errors errors)"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${YELLOW}Creating rollback snapshot: ${SNAPSHOT_PREFIX}${NC}"
    echo ""
    
    # Create all snapshot components
    if ! create_database_snapshot; then
        log "ERROR" "Database snapshot creation failed"
        exit 1
    fi
    
    if ! backup_docker_images; then
        log "ERROR" "Docker image backup failed"
        exit 1
    fi
    
    if ! backup_configurations; then
        log "ERROR" "Configuration backup failed"
        exit 1
    fi
    
    if ! capture_system_state; then
        log "ERROR" "System state capture failed"
        exit 1
    fi
    
    if ! create_rollback_instructions; then
        log "ERROR" "Rollback instructions creation failed"
        exit 1
    fi
    
    if ! create_snapshot_manifest; then
        log "ERROR" "Manifest creation failed"
        exit 1
    fi
    
    # Verify snapshot integrity
    if ! verify_snapshot; then
        log "ERROR" "Snapshot verification failed"
        exit 1
    fi
    
    # Calculate total snapshot size
    local total_size=$(du -sh "$SNAPSHOT_DIR" | cut -f1)
    
    echo ""
    log "SUCCESS" "🎉 Rollback snapshot created successfully!"
    echo ""
    echo -e "${GREEN}📊 Snapshot Summary:${NC}"
    echo -e "  Snapshot ID: ${SNAPSHOT_PREFIX}"
    echo -e "  Location: ${SNAPSHOT_DIR}"
    echo -e "  Total Size: ${total_size}"
    echo -e "  Files Created: $(find "${SNAPSHOT_DIR}" -name "${SNAPSHOT_PREFIX}*" | wc -l | tr -d ' ')"
    echo ""
    echo -e "${BLUE}📁 Snapshot Files:${NC}"
    find "${SNAPSHOT_DIR}" -name "${SNAPSHOT_PREFIX}*" -exec basename {} \; | sort | sed 's/^/  /'
    echo ""
    echo -e "${YELLOW}📖 Next Steps:${NC}"
    echo -e "  1. Review: cat ${SNAPSHOT_DIR}/${SNAPSHOT_PREFIX}_ROLLBACK_INSTRUCTIONS.md"
    echo -e "  2. Test rollback procedure in staging (recommended)"
    echo -e "  3. Keep snapshot available during deployment"
    echo -e "  4. Use snapshot for emergency rollback if needed"
    
    return 0
}

# Execute main function
main

echo ""
echo -e "${GREEN}✅ Rollback snapshot ready for use${NC}"