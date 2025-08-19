// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";
import {LiftTokens} from "../src/LiftTokens.sol";
// import {AllocationEscrow} from "../src/AllocationEscrow.sol"; // Temporarily removed
import {ProjectNFT} from "../src/ProjectNFT.sol";

contract DeployTestnet is Script {
    MethodRegistry public methodRegistry;
    LiftTokens public liftTokens;
    // AllocationEscrow public allocationEscrow; // Temporarily removed
    ProjectNFT public projectNFT;
    ERC1967Proxy public projectNFTProxy;

    // Testnet configuration
    string constant INITIAL_URI = "https://api-testnet.orenna.com/lift-tokens/{id}/metadata";
    
    // VWBA v2.0 Method Configuration
    bytes32 constant VWBA_METHOD_ID = keccak256("VWBA-v2.0-testnet");
    bytes32 constant VWBA_METHOD_HASH = keccak256("QmVWBAv2MethodSpecificationTestnet2024");
    string constant VWBA_METHOD_URI = "https://api-testnet.orenna.com/verification-methods/vwba-v2";
    
    function setUp() public {}

    function run() public {
        // Use the specific private key provided for testnet deployment
        uint256 deployerPrivateKey = 0x1679d6072b86d01680a959ae236848d957e39131ee8e5efd63baa11ffe4ffc6a;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying testnet contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MethodRegistry
        console.log("Deploying MethodRegistry...");
        methodRegistry = new MethodRegistry();
        console.log("MethodRegistry deployed at:", address(methodRegistry));

        // 2. Deploy ProjectNFT implementation first
        console.log("Deploying ProjectNFT implementation...");
        ProjectNFT projectNFTImpl = new ProjectNFT();
        console.log("ProjectNFT implementation deployed at:", address(projectNFTImpl));

        // 3. Deploy ProjectNFT proxy with initialization
        console.log("Deploying ProjectNFT proxy...");
        bytes memory initData = abi.encodeWithSignature("initialize(address)", deployer);
        projectNFTProxy = new ERC1967Proxy(address(projectNFTImpl), initData);
        projectNFT = ProjectNFT(address(projectNFTProxy));
        console.log("ProjectNFT proxy deployed at:", address(projectNFTProxy));

        // 4. Deploy LiftTokens with MethodRegistry and ProjectNFT reference
        console.log("Deploying LiftTokens...");
        liftTokens = new LiftTokens(INITIAL_URI, methodRegistry, projectNFT);
        console.log("LiftTokens deployed at:", address(liftTokens));

        // 7. Configure VWBA verification method
        console.log("Registering VWBA v2.0 testnet verification method...");
        
        MethodRegistry.VerificationCriteria memory vwbaCriteria = MethodRegistry.VerificationCriteria({
            minimumConfidence: 7000, // 70% confidence for testnet
            validationPeriod: 7 days, // Shorter period for testnet
            approvedValidators: new address[](0),
            requiredEvidenceTypes: getVWBAEvidenceTypes(),
            minValidators: 1
        });

        methodRegistry.registerMethod(
            VWBA_METHOD_ID,
            VWBA_METHOD_HASH,
            VWBA_METHOD_URI,
            2, // Major version 2
            0, // Minor version 0
            "VWBA-v2.0-testnet",
            vwbaCriteria
        );

        console.log("VWBA method registered with ID:", vm.toString(VWBA_METHOD_ID));

        // 8. Grant roles for testnet operation
        console.log("Setting up testnet roles...");
        
        // Grant VERIFIER_ROLE to deployer for testing
        liftTokens.grantRole(liftTokens.VERIFIER_ROLE(), deployer);
        liftTokens.grantRole(liftTokens.PROJECT_ADMIN_ROLE(), deployer);
        
        // Grant ProjectNFT roles to deployer for testing
        projectNFT.grantRole(projectNFT.REGISTRY_ADMIN_ROLE(), deployer);
        projectNFT.grantRole(projectNFT.VERIFIER_ROLE(), deployer);
        
        console.log("Roles granted to deployer for testing");

        // 9. Verify deployment
        console.log("\n=== Testnet Deployment Verification ===");
        console.log("MethodRegistry address:", address(methodRegistry));
        console.log("LiftTokens address:", address(liftTokens));
        console.log("ProjectNFT implementation:", address(projectNFTImpl));
        console.log("ProjectNFT proxy:", address(projectNFTProxy));
        console.log("VWBA method active:", methodRegistry.isActive(VWBA_METHOD_ID));
        console.log("ProjectNFT total projects:", projectNFT.totalProjects());

        // 10. Log deployment addresses for manual recording
        console.log("\n=== COPY THESE ADDRESSES ===");
        console.log("METHOD_REGISTRY_ADDRESS=", vm.toString(address(methodRegistry)));
        console.log("LIFT_TOKENS_ADDRESS=", vm.toString(address(liftTokens)));
        console.log("PROJECT_NFT_ADDRESS=", vm.toString(address(projectNFTProxy)));
        console.log("PROJECT_NFT_IMPL_ADDRESS=", vm.toString(address(projectNFTImpl)));
        console.log("VWBA_METHOD_ID=", vm.toString(VWBA_METHOD_ID));
        console.log("DEPLOYMENT_BLOCK=", vm.toString(block.number));
        console.log("CHAIN_ID=", vm.toString(block.chainid));
        console.log("================================");

        // 11. Create a test project for validation
        console.log("\n=== Creating Test Project ===");
        uint256 testProjectId = projectNFT.createProject(
            deployer,
            "ipfs://QmTestTokenURI123",
            "ipfs://QmTestRegistryData456", 
            keccak256("test-data-hash")
        );
        console.log("Test project created with ID:", testProjectId);

        vm.stopBroadcast();

        console.log("\n=== Testnet Deployment Complete ===");
        console.log("Next steps:");
        console.log("1. Update testnet API environment variables");
        console.log("2. Run integration tests against testnet contracts");
        console.log("3. Test project lifecycle workflows");
        console.log("4. Validate event indexing and API integration");
        console.log("5. Test UI components with testnet contracts");
    }

    function getVWBAEvidenceTypes() internal pure returns (string[] memory) {
        string[] memory evidenceTypes = new string[](5);
        evidenceTypes[0] = "WATER_MEASUREMENT_DATA";
        evidenceTypes[1] = "BASELINE_ASSESSMENT";
        evidenceTypes[2] = "SITE_VERIFICATION";
        evidenceTypes[3] = "GPS_COORDINATES";
        evidenceTypes[4] = "METHODOLOGY_DOCUMENTATION";
        return evidenceTypes;
    }
}