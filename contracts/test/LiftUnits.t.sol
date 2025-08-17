// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LiftUnits} from "../src/LiftUnits.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";

contract LiftUnitsTest is Test {
    LiftUnits liftUnits;
    MethodRegistry methodRegistry;
    
    address admin = address(0x1);
    address verifier = address(0x2);
    address escrow = address(0x3);
    
    bytes32 methodId = keccak256("test-method");
    bytes32 methodHash = keccak256("test-hash");
    uint256 projectId = 1;

    function setUp() public {
        vm.startPrank(admin);
        
        methodRegistry = new MethodRegistry();
        liftUnits = new LiftUnits("https://test.com/{id}", methodRegistry);
        
        liftUnits.grantRole(liftUnits.PROJECT_ADMIN_ROLE(), admin);
        liftUnits.grantRole(liftUnits.VERIFIER_ROLE(), verifier);
        
        methodRegistry.registerMethod(
            methodId, 
            methodHash, 
            "ipfs://test", 
            0, 
            1, 
            "Test Method"
        );
        
        vm.stopPrank();
    }
    
    function test_ConfigureIssuance() public {
        // First configuration should succeed
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
        
        // Check that config was stored (now with 9 fields including 'configured')
        (
            bytes32 storedMethodId,
            bytes32 storedMethodHash,
            uint256 targetUnits,
            uint256 minUnits,
            uint256 maxUnits,
            address storedEscrow,
            uint256 nonce,
            bool issuanceCertified,
            bool configured
        ) = liftUnits.issuanceConfigs(projectId);
        
        assertEq(storedMethodId, methodId);
        assertEq(storedMethodHash, methodHash);
        assertEq(targetUnits, 100000);
        assertEq(minUnits, 80000);
        assertEq(maxUnits, 120000);
        assertEq(storedEscrow, escrow);
        assertEq(nonce, 0);
        assertFalse(issuanceCertified);
        assertTrue(configured);  // Should be true after configuration
    }
    
    function test_ConfigureIssuance_CannotReconfigure() public {
        // Configure once
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
        
        // Try to configure again - should fail with "already-configured"
        vm.expectRevert("already-configured");
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
    }
    
    function test_ConfigureIssuance_InvalidMethod() public {
        bytes32 invalidMethodId = keccak256("invalid");
        
        vm.expectRevert("method-inactive");
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            invalidMethodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
    }
    
    function test_ConfigureIssuance_InvalidParameters() public {
        // Test min > target
        vm.expectRevert("min-exceeds-target");
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            120000,  // min > target
            150000, 
            escrow
        );
        
        // Test max < target
        vm.expectRevert("max-below-target");
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            90000,  // max < target
            escrow
        );
        
        // Test invalid escrow
        vm.expectRevert("invalid-escrow");
        vm.prank(admin);
        liftUnits.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            address(0)  // invalid escrow
        );
    }
    
    function test_GetTokenStats() public {
        uint256 tokenId = 1001;
        
        (uint256 totalMinted, uint256 totalRetiredAmount, uint256 circulating) = 
            liftUnits.getTokenStats(tokenId);
        
        assertEq(totalMinted, 0);
        assertEq(totalRetiredAmount, 0);
        assertEq(circulating, 0);
    }
}
