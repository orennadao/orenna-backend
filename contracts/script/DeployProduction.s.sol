// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";
import {LiftTokens} from "../src/LiftTokens.sol";
import {ProjectNFT} from "../src/ProjectNFT.sol";
import {IProjectNFT} from "../src/interfaces/IProjectNFT.sol";

contract DeployProduction is Script {
    MethodRegistry public methodRegistry;
    LiftTokens public liftTokens;
    ProjectNFT public projectNFT;

    // Production configuration
    string constant INITIAL_URI = "https://api.orenna.com/api/lift-tokens/{id}/metadata";
    
    // VWBA v2.0 Method Configuration
    bytes32 constant VWBA_METHOD_ID = keccak256("VWBA-v2.0");
    bytes32 constant VWBA_METHOD_HASH = keccak256("QmVWBAv2MethodSpecification2024");
    string constant VWBA_METHOD_URI = "https://api.orenna.com/verification-methods/vwba-v2";
    
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MethodRegistry
        console.log("Deploying MethodRegistry...");
        methodRegistry = new MethodRegistry();
        console.log("MethodRegistry deployed at:", address(methodRegistry));

        // 2. Deploy ProjectNFT
        console.log("Deploying ProjectNFT...");
        projectNFT = new ProjectNFT();
        projectNFT.initialize(deployer);
        console.log("ProjectNFT deployed at:", address(projectNFT));

        // 3. Deploy LiftTokens with MethodRegistry and ProjectNFT reference
        console.log("Deploying LiftTokens...");
        liftTokens = new LiftTokens(INITIAL_URI, methodRegistry, IProjectNFT(address(projectNFT)));
        console.log("LiftTokens deployed at:", address(liftTokens));

        // 3. Configure VWBA verification method
        console.log("Registering VWBA v2.0 verification method...");
        
        // Setup VWBA verification criteria
        MethodRegistry.VerificationCriteria memory vwbaCriteria = MethodRegistry.VerificationCriteria({
            minimumConfidence: 8000, // 80% confidence required
            validationPeriod: 30 days,
            approvedValidators: new address[](0), // Empty array = any validator approved
            requiredEvidenceTypes: getVWBAEvidenceTypes(),
            minValidators: 1 // Minimum 1 validator required
        });

        methodRegistry.registerMethod(
            VWBA_METHOD_ID,
            VWBA_METHOD_HASH,
            VWBA_METHOD_URI,
            2, // Major version 2
            0, // Minor version 0
            "VWBA-v2.0", // Method name
            vwbaCriteria
        );

        console.log("VWBA method registered with ID:", vm.toString(VWBA_METHOD_ID));

        // 4. Grant roles for production operation
        console.log("Setting up production roles...");
        
        // Grant VERIFIER_ROLE to deployer initially (should be changed in production)
        liftTokens.grantRole(liftTokens.VERIFIER_ROLE(), deployer);
        console.log("VERIFIER_ROLE granted to deployer");

        // Grant PROJECT_ADMIN_ROLE to deployer initially
        liftTokens.grantRole(liftTokens.PROJECT_ADMIN_ROLE(), deployer);
        console.log("PROJECT_ADMIN_ROLE granted to deployer");

        // 5. Verify deployment
        console.log("\n=== Deployment Verification ===");
        console.log("MethodRegistry address:", address(methodRegistry));
        console.log("LiftTokens address:", address(liftTokens));
        console.log("VWBA method active:", methodRegistry.isActive(VWBA_METHOD_ID));
        console.log("LiftTokens URI template:", liftTokens.uri(0));

        // 6. Export deployment addresses
        string memory deploymentInfo = string.concat(
            "export LIFT_TOKENS_ADDRESS=", vm.toString(address(liftTokens)), "\n",
            "export METHOD_REGISTRY_ADDRESS=", vm.toString(address(methodRegistry)), "\n",
            "export VWBA_METHOD_ID=", vm.toString(VWBA_METHOD_ID), "\n",
            "export DEPLOYMENT_BLOCK=", vm.toString(block.number), "\n"
        );
        
        vm.writeFile("deployment-addresses.env", deploymentInfo);
        console.log("Deployment addresses written to deployment-addresses.env");

        vm.stopBroadcast();

        console.log("\n=== Production Deployment Complete ===");
        console.log("Next steps:");
        console.log("1. Update API environment variables with contract addresses");
        console.log("2. Configure verification validators in MethodRegistry");
        console.log("3. Test verification workflow with staging environment");
        console.log("4. Transfer admin roles to production multisig");
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