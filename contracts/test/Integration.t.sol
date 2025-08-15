// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";
import {LiftUnits} from "../src/LiftUnits.sol";

contract IntegrationTest is Test {
    MethodRegistry methodRegistry;
    LiftUnits liftUnits;

    address admin = makeAddr("admin");
    uint256 projectId = 1;
    bytes32 methodId = keccak256("WaterQuality-v1.2");
    bytes32 methodHash = keccak256("ipfs://method-specification");

    function setUp() public {
        vm.startPrank(admin);
        methodRegistry = new MethodRegistry();
        liftUnits = new LiftUnits("https://api.orenna.dao/lift-units/{id}", methodRegistry);
        
        // Grant necessary roles to admin
        liftUnits.grantRole(liftUnits.PROJECT_ADMIN_ROLE(), admin);
        
        vm.stopPrank();
    }

    function test_BasicDeployment() public {
        assertTrue(address(methodRegistry) != address(0));
        assertTrue(address(liftUnits) != address(0));
    }

    function test_FullWorkflow() public {
        // Test method registration
        vm.prank(admin);
        methodRegistry.registerMethod(methodId, methodHash, "ipfs://method-doc", 1, 2, "Water Quality v1.2");
        assertTrue(methodRegistry.isActive(methodId));

        // Test issuance configuration (admin already has PROJECT_ADMIN_ROLE from setUp)
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100_000, 
            80_000, 
            130_000, 
            admin // Use admin as escrow for testing
        );

        // Verify configuration
        (, , uint256 targetUnits, uint256 minUnits, uint256 maxUnits, , , , bool configured) = 
            liftUnits.issuanceConfigs(projectId);
        
        assertEq(targetUnits, 100_000);
        assertEq(minUnits, 80_000);
        assertEq(maxUnits, 130_000);
        assertTrue(configured);
    }

    function test_TokenStats() public {
        uint256 tokenId = 1001;
        (uint256 totalMinted, uint256 totalRetired, uint256 circulating) = 
            liftUnits.getTokenStats(tokenId);
        
        assertEq(totalMinted, 0);
        assertEq(totalRetired, 0);
        assertEq(circulating, 0);
    }

    function test_MethodRegistryRoles() public {
        // Test that admin has the right roles
        assertTrue(methodRegistry.hasRole(methodRegistry.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(methodRegistry.hasRole(methodRegistry.TECHNICAL_COMMITTEE_ROLE(), admin));
        assertTrue(methodRegistry.hasRole(methodRegistry.GOVERNANCE_ROLE(), admin));
    }

    function test_LiftUnitsRoles() public {
        // Test that admin has the right roles
        assertTrue(liftUnits.hasRole(liftUnits.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(liftUnits.hasRole(liftUnits.PROJECT_ADMIN_ROLE(), admin));
    }
}