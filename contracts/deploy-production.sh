#!/bin/bash

# Production Smart Contract Deployment Script
# This script deploys the verification system contracts to production networks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🚀 Orenna Verification System - Production Deployment${NC}"
echo "=================================================="

# Check required environment variables
check_env_vars() {
    local required_vars=("DEPLOYER_PRIVATE_KEY" "RPC_URL")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        echo -e "${YELLOW}Please set these variables and try again.${NC}"
        exit 1
    fi
}

# Validate network configuration
validate_network() {
    local network=$1
    echo -e "${YELLOW}🔍 Validating network configuration for $network...${NC}"
    
    # Test RPC connection
    if ! curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$RPC_URL" > /dev/null; then
        echo -e "${RED}❌ Cannot connect to RPC endpoint: $RPC_URL${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Network connection validated${NC}"
}

# Build contracts
build_contracts() {
    echo -e "${YELLOW}🔨 Building contracts...${NC}"
    forge build
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Contract build failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Contracts built successfully${NC}"
}

# Run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running contract tests...${NC}"
    forge test
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Contract tests failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Deploy contracts
deploy_contracts() {
    local network=$1
    echo -e "${YELLOW}📦 Deploying contracts to $network...${NC}"
    
    # Create deployment backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="deployments/${network}_${timestamp}"
    mkdir -p "$backup_dir"
    
    # Deploy using Forge script
    forge script script/DeployProduction.s.sol:DeployProduction \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --verify \
        --etherscan-api-key "$ETHERSCAN_API_KEY" \
        --gas-estimate-multiplier 120 \
        -vvv
    
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
    
    # Backup deployment artifacts
    cp -r broadcast/ "$backup_dir/"
    cp deployment-addresses.env "$backup_dir/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Deployment completed successfully${NC}"
    echo -e "${GREEN}📁 Deployment artifacts backed up to: $backup_dir${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
    
    if [[ ! -f "deployment-addresses.env" ]]; then
        echo -e "${RED}❌ deployment-addresses.env not found${NC}"
        exit 1
    fi
    
    # Source the deployment addresses
    source deployment-addresses.env
    
    # Verify contracts are deployed and accessible
    echo "Verifying contract deployments..."
    echo "- LiftTokens: $LIFT_TOKENS_ADDRESS"
    echo "- MethodRegistry: $METHOD_REGISTRY_ADDRESS"
    echo "- VWBA Method ID: $VWBA_METHOD_ID"
    echo "- Deployment Block: $DEPLOYMENT_BLOCK"
    
    # Test contract interaction
    forge script script/VerifyDeployment.s.sol:VerifyDeployment \
        --rpc-url "$RPC_URL" \
        --broadcast
    
    echo -e "${GREEN}✅ Deployment verification completed${NC}"
}

# Update environment files
update_env_files() {
    echo -e "${YELLOW}📝 Updating environment configuration...${NC}"
    
    # Create production environment template
    cat > "../.env.production.template" << EOF
# Production Contract Addresses (Generated: $(date))
LIFT_TOKENS_ADDRESS=$LIFT_TOKENS_ADDRESS
METHOD_REGISTRY_ADDRESS=$METHOD_REGISTRY_ADDRESS
VWBA_METHOD_ID=$VWBA_METHOD_ID
DEPLOYMENT_BLOCK=$DEPLOYMENT_BLOCK

# Production RPC Configuration
RPC_URL=$RPC_URL
CHAIN_ID=${CHAIN_ID:-1}

# API Configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/orenna_prod
REDIS_URL=redis://localhost:6379

# Security (Update these in production)
API_CORS_ORIGIN=https://app.orenna.com
MINTER_PRIVATE_KEY=REPLACE_WITH_PRODUCTION_KEY
EOF

    echo -e "${GREEN}✅ Environment template created: ../.env.production.template${NC}"
    echo -e "${YELLOW}⚠️  Remember to update the template with production values${NC}"
}

# Main deployment flow
main() {
    local network=${1:-"mainnet"}
    
    echo -e "${YELLOW}Network: $network${NC}"
    echo -e "${YELLOW}RPC URL: $RPC_URL${NC}"
    echo ""
    
    # Confirmation prompt for production
    if [[ "$network" == "mainnet" ]]; then
        echo -e "${RED}⚠️  WARNING: This will deploy to MAINNET with real ETH!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo "Deployment cancelled."
            exit 0
        fi
    fi
    
    # Execute deployment steps
    check_env_vars
    validate_network "$network"
    build_contracts
    run_tests
    deploy_contracts "$network"
    verify_deployment
    update_env_files
    
    echo ""
    echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
    echo -e "${GREEN}📋 Next steps:${NC}"
    echo "1. Update API server environment variables"
    echo "2. Configure verification validators"
    echo "3. Test verification workflow"
    echo "4. Transfer admin roles to production multisig"
    echo ""
    echo -e "${YELLOW}📄 Deployment details saved in deployment-addresses.env${NC}"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi