#!/bin/bash

# Setup script for Lift Forward contracts
set -e

echo "🚀 Setting up Lift Forward contracts..."

# Ensure we're in the contracts directory
if [[ ! -f "foundry.toml" && ! -d "src" ]]; then
    echo "📁 Initializing Foundry project..."
    forge init --no-git --force
fi

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p src/interfaces test/integration script

# Remove default files
echo "🧹 Cleaning up default files..."
rm -f src/Counter.sol test/Counter.t.sol script/Counter.s.sol

# Create foundry.toml
echo "⚙️  Creating foundry.toml..."
cat > foundry.toml << 'EOF'
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"

# Solc compiler settings
solc = "0.8.24"
evm_version = "paris"
optimizer = true
optimizer_runs = 200
via_ir = false

# Formatter settings
line_length = 120
tab_width = 4
bracket_spacing = true
int_types = "long"

# Testing settings
fuzz = { runs = 256 }
invariant = { runs = 256, depth = 15 }

# Gas reporting
gas_reports = ["*"]

# RPC endpoints for deployment and testing
[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
sepolia = "${SEPOLIA_RPC_URL}"
polygon = "${POLYGON_RPC_URL}"
arbitrum = "${ARBITRUM_RPC_URL}"
localhost = "http://127.0.0.1:8545"

# Etherscan API keys for verification
[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
sepolia = { key = "${ETHERSCAN_API_KEY}" }
polygon = { key = "${POLYGONSCAN_API_KEY}" }
arbitrum = { key = "${ARBISCAN_API_KEY}" }

# Libraries and remappings
[dependencies]
openzeppelin-contracts = "5.0.1"

# Profile-specific overrides
[profile.ci]
fuzz = { runs = 10000 }
invariant = { runs = 1000, depth = 20 }

[profile.lite]
optimizer = false
fuzz = { runs = 32 }
invariant = { runs = 32, depth = 10 }
EOF

# Create remappings.txt
echo "🔗 Creating remappings.txt..."
cat > remappings.txt << 'EOF'
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/=lib/openzeppelin-contracts/
forge-std/=lib/forge-std/src/
ds-test/=lib/ds-test/src/
src/=src/
EOF

# Create interfaces
echo "🔌 Creating interfaces..."
cat > src/interfaces/IMethodRegistry.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMethodRegistry
 * @notice Interface for the ecosystem improvement measurement method registry
 */
interface IMethodRegistry {
    struct MethodSpec {
        bytes32 id;                 // Unique method identifier
        bytes32 hash;               // Hash of method specification bundle
        string uri;                 // IPFS URI to method documentation
        bool active;                // Whether method is currently active
        uint64 majorVersion;        // Major version number
        uint64 minorVersion;        // Minor version number
        uint64 createdAt;           // Creation timestamp
        address proposedBy;         // Who proposed this method
    }

    /**
     * @notice Get method specification by ID
     * @param methodId Method identifier
     * @return Method specification
     */
    function methods(bytes32 methodId) external view returns (MethodSpec memory);

    /**
     * @notice Check if a method is active
     * @param methodId Method identifier
     * @return Whether the method is active
     */
    function isActive(bytes32 methodId) external view returns (bool);

    /**
     * @notice Get method by human-readable name
     * @param name Method name
     * @return Method specification
     */
    function getMethodByName(string calldata name) external view returns (MethodSpec memory);

    /**
     * @notice Check if method exists
     * @param methodId Method identifier
     * @return Whether method is registered
     */
    function methodExists(bytes32 methodId) external view returns (bool);
}
EOF

cat > src/interfaces/IRepaymentEscrow.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRepaymentEscrow
 * @notice Interface for the repayment escrow contract
 */
interface IRepaymentEscrow {
    enum RepaymentPolicy { FUNDER_FIRST_95_5, AFTER_REPAYMENT, TAPERED }

    struct RepaymentConfig {
        uint256 forwardPrincipal;      // Original forward amount
        uint256 repaymentCap;          // Max repayment to funder
        uint256 platformFeeBps;        // Platform fee in basis points
        uint256 platformFeeCap;        // Max platform fee in absolute terms
        address funder;                // Funder address
        address stewardOrPool;         // Steward/reinvestment pool address
        address platformTreasury;      // Platform treasury address
        address paymentToken;          // Payment token address
        RepaymentPolicy policy;        // Repayment waterfall policy
        uint256 paidToFunder;          // Total paid to funder so far
        uint256 platformFeesPaid;      // Total platform fees paid so far
        bool configured;               // Whether config is set
    }

    /**
     * @notice Notify escrow of proceeds from unit sales
     * @param projectId Project identifier
     * @param amount Proceeds amount
     * @param considerationRef Reference to prevent double-processing
     */
    function notifyProceeds(
        uint256 projectId,
        uint256 amount,
        bytes32 considerationRef
    ) external;

    /**
     * @notice Get repayment progress for a project
     * @param projectId Project identifier
     * @return config Repayment configuration
     * @return repaymentProgress Percentage of repayment cap paid (in bps)
     * @return feeProgress Percentage of fee cap paid (in bps)
     */
    function getRepaymentStatus(uint256 projectId) external view returns (
        RepaymentConfig memory config,
        uint256 repaymentProgress,
        uint256 feeProgress
    );

    /**
     * @notice Check if a consideration has been processed
     * @param projectId Project identifier
     * @param considerationRef Consideration reference
     * @return Whether the consideration has been processed
     */
    function isConsiderationProcessed(
        uint256 projectId,
        bytes32 considerationRef
    ) external view returns (bool);
}
EOF

# Install dependencies
echo "📦 Installing dependencies..."
forge install --no-git

echo "✅ Setup complete! You can now run:"
echo "   forge build    # Compile contracts"
echo "   forge test     # Run tests"  
echo "   forge test --gas-report  # Run tests with gas reporting"
echo ""
echo "🔧 To finish setup, you'll need to:"
echo "   1. Create the main contract files in src/"
echo "   2. Create the test files in test/"
echo "   3. Create the deployment script in script/"
echo ""
echo "Would you like me to create those files too? (y/n)"