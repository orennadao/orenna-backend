#!/bin/bash

# IPFS Production Setup Script
# Sets up a production-ready IPFS cluster for verification evidence storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🌐 IPFS Production Cluster Setup${NC}"
echo "================================="

# Generate cluster secret if not provided
generate_cluster_secret() {
    if [[ -z "$CLUSTER_SECRET" ]]; then
        echo -e "${YELLOW}🔐 Generating IPFS cluster secret...${NC}"
        CLUSTER_SECRET=$(openssl rand -hex 32)
        echo "CLUSTER_SECRET=$CLUSTER_SECRET" > .env.ipfs
        echo -e "${GREEN}✅ Cluster secret generated and saved to .env.ipfs${NC}"
    fi
}

# Create necessary directories
setup_directories() {
    echo -e "${YELLOW}📁 Creating directory structure...${NC}"
    mkdir -p ipfs-config/node1 ipfs-config/node2
    mkdir -p ssl
    mkdir -p logs
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    if [[ ! -f "ssl/ipfs.orenna.com.crt" ]]; then
        echo -e "${YELLOW}🔒 Generating SSL certificates...${NC}"
        
        # Create certificate configuration
        cat > ssl/ipfs.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Orenna
OU = IT Department
CN = ipfs.orenna.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ipfs.orenna.com
DNS.2 = *.ipfs.orenna.com
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

        # Generate private key and certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/ipfs.orenna.com.key \
            -out ssl/ipfs.orenna.com.crt \
            -config ssl/ipfs.conf \
            -extensions v3_req

        echo -e "${GREEN}✅ SSL certificates generated${NC}"
        echo -e "${YELLOW}⚠️  For production, replace with proper SSL certificates${NC}"
    else
        echo -e "${GREEN}✅ SSL certificates already exist${NC}"
    fi
}

# Create monitoring configuration
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up IPFS monitoring...${NC}"
    
    cat > prometheus-ipfs.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ipfs-nodes'
    static_configs:
      - targets: 
        - 'ipfs-node1:5001'
        - 'ipfs-node2:5001'
    metrics_path: '/debug/metrics/prometheus'
    scrape_interval: 10s

  - job_name: 'ipfs-cluster'
    static_configs:
      - targets: ['ipfs-cluster:9094']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'ipfs-nginx'
    static_configs:
      - targets: ['ipfs-nginx:8090']
    metrics_path: '/nginx_status'
    scrape_interval: 30s
EOF

    echo -e "${GREEN}✅ Monitoring configuration created${NC}"
}

# Start IPFS cluster
start_cluster() {
    echo -e "${YELLOW}🚀 Starting IPFS cluster...${NC}"
    
    # Load environment variables
    if [[ -f ".env.ipfs" ]]; then
        source .env.ipfs
    fi
    
    # Start the cluster
    CLUSTER_SECRET="$CLUSTER_SECRET" docker-compose -f docker-compose.ipfs.yml up -d
    
    echo -e "${YELLOW}⏳ Waiting for cluster to be ready...${NC}"
    sleep 30
    
    # Wait for nodes to be ready
    for i in {1..30}; do
        if docker exec orenna-ipfs-node1 ipfs id >/dev/null 2>&1; then
            echo -e "${GREEN}✅ IPFS node 1 is ready${NC}"
            break
        fi
        echo "Waiting for IPFS node 1... ($i/30)"
        sleep 5
    done
    
    for i in {1..30}; do
        if docker exec orenna-ipfs-node2 ipfs id >/dev/null 2>&1; then
            echo -e "${GREEN}✅ IPFS node 2 is ready${NC}"
            break
        fi
        echo "Waiting for IPFS node 2... ($i/30)"
        sleep 5
    done
}

# Configure cluster peers
configure_cluster() {
    echo -e "${YELLOW}🔗 Configuring cluster peers...${NC}"
    
    # Get node IDs
    NODE1_ID=$(docker exec orenna-ipfs-node1 ipfs id -f="<id>")
    NODE2_ID=$(docker exec orenna-ipfs-node2 ipfs id -f="<id>")
    
    echo "Node 1 ID: $NODE1_ID"
    echo "Node 2 ID: $NODE2_ID"
    
    # Connect nodes
    docker exec orenna-ipfs-node1 ipfs swarm connect "/dns4/ipfs-node2/tcp/4001/p2p/$NODE2_ID" || true
    docker exec orenna-ipfs-node2 ipfs swarm connect "/dns4/ipfs-node1/tcp/4001/p2p/$NODE1_ID" || true
    
    echo -e "${GREEN}✅ Cluster peers configured${NC}"
}

# Test cluster functionality
test_cluster() {
    echo -e "${YELLOW}🧪 Testing cluster functionality...${NC}"
    
    # Test file upload and retrieval
    echo "Test evidence file" > test-evidence.txt
    
    # Add file to IPFS
    HASH=$(docker exec orenna-ipfs-node1 ipfs add -q test-evidence.txt)
    echo "File hash: $HASH"
    
    # Verify file can be retrieved from both nodes
    docker exec orenna-ipfs-node1 ipfs cat "$HASH" > retrieved1.txt
    docker exec orenna-ipfs-node2 ipfs cat "$HASH" > retrieved2.txt
    
    if cmp -s test-evidence.txt retrieved1.txt && cmp -s test-evidence.txt retrieved2.txt; then
        echo -e "${GREEN}✅ Cluster replication working correctly${NC}"
    else
        echo -e "${RED}❌ Cluster replication failed${NC}"
        exit 1
    fi
    
    # Cleanup test files
    rm -f test-evidence.txt retrieved1.txt retrieved2.txt
    
    # Test cluster API
    if curl -s "http://localhost:9094/id" >/dev/null; then
        echo -e "${GREEN}✅ Cluster API accessible${NC}"
    else
        echo -e "${RED}❌ Cluster API not accessible${NC}"
    fi
}

# Display cluster information
show_cluster_info() {
    echo -e "${GREEN}🎉 IPFS Cluster Setup Complete!${NC}"
    echo "=================================="
    echo ""
    echo "Cluster Endpoints:"
    echo "- IPFS API (Load Balanced): http://localhost:5001"
    echo "- IPFS Gateway (Load Balanced): http://localhost:80"
    echo "- IPFS Gateway (SSL): https://localhost:443"
    echo "- Cluster API: http://localhost:9094"
    echo "- Node 1 API: http://localhost:5001"
    echo "- Node 2 API: http://localhost:5002"
    echo ""
    echo "Monitoring:"
    echo "- Nginx metrics: http://localhost:8090/nginx_status"
    echo "- Node metrics: http://localhost:9100/metrics"
    echo ""
    echo "Management Commands:"
    echo "- View cluster status: docker exec orenna-ipfs-cluster ipfs-cluster-ctl peers ls"
    echo "- View cluster pins: docker exec orenna-ipfs-cluster ipfs-cluster-ctl status"
    echo "- Add file to cluster: docker exec orenna-ipfs-cluster ipfs-cluster-ctl add <file>"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to:${NC}"
    echo "1. Replace self-signed SSL certificates with proper ones for production"
    echo "2. Configure firewall rules for external access"
    echo "3. Set up backup procedures for IPFS data"
    echo "4. Monitor cluster health and storage usage"
}

# Main setup flow
main() {
    echo -e "${YELLOW}Starting IPFS production cluster setup...${NC}"
    echo ""
    
    generate_cluster_secret
    setup_directories
    generate_ssl_certs
    setup_monitoring
    start_cluster
    configure_cluster
    test_cluster
    show_cluster_info
    
    echo ""
    echo -e "${GREEN}✅ IPFS production cluster is ready for verification evidence storage!${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Stopping IPFS cluster...${NC}"
    docker-compose -f docker-compose.ipfs.yml down
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-setup}" in
        "setup")
            main
            ;;
        "stop")
            cleanup
            ;;
        "restart")
            cleanup
            sleep 5
            main
            ;;
        *)
            echo "Usage: $0 [setup|stop|restart]"
            exit 1
            ;;
    esac
fi