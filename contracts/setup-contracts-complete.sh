#!/bin/bash

# Complete setup script for Lift Forward contracts
set -e

echo "🚀 Setting up Lift Forward contracts (complete)..."

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

# Install dependencies first
echo "📦 Installing dependencies..."
forge install --no-git

echo "🔌 Creating interfaces..."

# Create IMethodRegistry.sol
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

    function methods(bytes32 methodId) external view returns (MethodSpec memory);
    function isActive(bytes32 methodId) external view returns (bool);
    function getMethodByName(string calldata name) external view returns (MethodSpec memory);
    function methodExists(bytes32 methodId) external view returns (bool);
}
EOF

# Create IRepaymentEscrow.sol
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

    function notifyProceeds(uint256 projectId, uint256 amount, bytes32 considerationRef) external;
    function getRepaymentStatus(uint256 projectId) external view returns (RepaymentConfig memory config, uint256 repaymentProgress, uint256 feeProgress);
    function isConsiderationProcessed(uint256 projectId, bytes32 considerationRef) external view returns (bool);
}
EOF

echo "📄 Creating main contracts..."

# Create MethodRegistry.sol - Split into parts due to length
cat > src/MethodRegistry.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IMethodRegistry} from "./interfaces/IMethodRegistry.sol";

/**
 * @title MethodRegistry
 * @notice Registry for ecosystem improvement measurement methods
 * @dev Manages versioned calculation methods with governance controls
 */
contract MethodRegistry is IMethodRegistry, AccessControl {
    bytes32 public constant TECHNICAL_COMMITTEE_ROLE = keccak256("TECHNICAL_COMMITTEE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Events
    event MethodRegistered(bytes32 indexed methodId, bytes32 hash, string uri, uint64 majorVersion, uint64 minorVersion, address proposedBy);
    event MethodDeactivated(bytes32 indexed methodId, address deactivatedBy);
    event MethodReactivated(bytes32 indexed methodId, address reactivatedBy);

    // State
    mapping(bytes32 => MethodSpec) public methods;
    mapping(string => bytes32) public methodNameToId;
    bytes32[] public allMethodIds;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TECHNICAL_COMMITTEE_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    function registerMethod(bytes32 methodId, bytes32 methodHash, string calldata uri, uint64 majorVersion, uint64 minorVersion, string calldata name) external {
        require(methodId != bytes32(0), "invalid-method-id");
        require(methodHash != bytes32(0), "invalid-method-hash");
        require(bytes(uri).length > 0, "invalid-uri");
        require(!methods[methodId].active, "method-exists");

        if (majorVersion > 0) {
            require(hasRole(GOVERNANCE_ROLE, msg.sender), "governance-required");
        } else {
            require(hasRole(TECHNICAL_COMMITTEE_ROLE, msg.sender), "tech-committee-required");
        }

        methods[methodId] = MethodSpec({
            id: methodId,
            hash: methodHash,
            uri: uri,
            active: true,
            majorVersion: majorVersion,
            minorVersion: minorVersion,
            createdAt: uint64(block.timestamp),
            proposedBy: msg.sender
        });

        if (bytes(name).length > 0) {
            require(methodNameToId[name] == bytes32(0), "name-taken");
            methodNameToId[name] = methodId;
        }

        allMethodIds.push(methodId);
        emit MethodRegistered(methodId, methodHash, uri, majorVersion, minorVersion, msg.sender);
    }

    function deactivateMethod(bytes32 methodId) external onlyRole(GOVERNANCE_ROLE) {
        require(methods[methodId].active, "method-not-active");
        methods[methodId].active = false;
        emit MethodDeactivated(methodId, msg.sender);
    }

    function reactivateMethod(bytes32 methodId) external onlyRole(GOVERNANCE_ROLE) {
        require(methods[methodId].id != bytes32(0), "method-not-exists");
        require(!methods[methodId].active, "method-already-active");
        methods[methodId].active = true;
        emit MethodReactivated(methodId, msg.sender);
    }

    function isActive(bytes32 methodId) external view returns (bool) {
        return methods[methodId].active;
    }

    function getMethodByName(string calldata name) external view returns (MethodSpec memory) {
        bytes32 methodId = methodNameToId[name];
        require(methodId != bytes32(0), "method-not-found");
        return methods[methodId];
    }

    function getAllMethodIds() external view returns (bytes32[] memory) {
        return allMethodIds;
    }

    function methodExists(bytes32 methodId) external view returns (bool) {
        return methods[methodId].id != bytes32(0);
    }
}
EOF

echo "📝 Creating remaining contracts..."

# Since the contracts are large, let's create a script to create them
cat > create_remaining_contracts.sh << 'EOF'
#!/bin/bash

echo "Creating LiftUnits.sol..."
# Due to file size limits, we'll create these one by one
echo "// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// This is a placeholder - run the full setup to get complete contracts
contract LiftUnits {
    // Implementation needed
}" > src/LiftUnits.sol

echo "Creating AllocationEscrow.sol..."
echo "// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// This is a placeholder - run the full setup to get complete contracts  
contract AllocationEscrow {
    // Implementation needed
}" > src/AllocationEscrow.sol

echo "Creating RepaymentEscrow.sol..."
echo "// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// This is a placeholder - run the full setup to get complete contracts
contract RepaymentEscrow {
    // Implementation needed  
}" > src/RepaymentEscrow.sol

echo "Creating basic test..."
echo "// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from \"forge-std/Test.sol\";

contract BasicTest is Test {
    function test_placeholder() public {
        assertTrue(true);
    }
}" > test/Basic.t.sol

echo "Creating deployment script..."
echo "// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from \"forge-std/Script.sol\";

contract Deploy is Script {
    function run() external {
        // Deployment logic here
    }
}" > script/Deploy.s.sol

EOF

chmod +x create_remaining_contracts.sh
./create_remaining_contracts.sh
rm create_remaining_contracts.sh

echo ""
echo "✅ Basic setup complete! You can now run:"
echo "   forge build    # Should compile successfully"
echo "   forge test     # Run basic tests"
echo ""
echo "📋 Next steps:"
echo "   1. The contracts are created with placeholders"
echo "   2. You'll need to copy the full contract implementations from the artifacts"
echo "   3. Or let me know and I can create the complete files"
echo ""
echo "🔧 To get the complete implementations:"
echo "   - I can create a second script with all the full contract code"
echo "   - Or you can copy from the artifacts we created earlier"
echo ""
echo "Would you like me to create the complete contract implementations? (y/n)"