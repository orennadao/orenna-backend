// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LiftTokens} from "../src/LiftTokens.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";
import {ProjectNFT} from "../src/ProjectNFT.sol";
import {IProjectNFT} from "../src/interfaces/IProjectNFT.sol";

contract LiftTokensTest is Test {
    LiftTokens liftTokens;
    MethodRegistry methodRegistry;
    ProjectNFT projectNFT;
    
    address admin = address(0x1);
    address verifier = address(0x2);
    address escrow = address(0x3);
    
    bytes32 methodId = keccak256("test-method");
    bytes32 methodHash = keccak256("test-hash");
    uint256 projectId = 1;

    function setUp() public {
        vm.startPrank(admin);
        
        methodRegistry = new MethodRegistry();
        projectNFT = new ProjectNFT();
        projectNFT.initialize(admin);
        liftTokens = new LiftTokens("https://test.com/{id}", methodRegistry, IProjectNFT(address(projectNFT)));
        
        liftTokens.grantRole(liftTokens.PROJECT_ADMIN_ROLE(), admin);
        liftTokens.grantRole(liftTokens.VERIFIER_ROLE(), verifier);
        
        // Grant ProjectNFT roles and create a test project
        projectNFT.grantRole(projectNFT.REGISTRY_ADMIN_ROLE(), admin);
        projectNFT.createProject(
            admin,
            "ipfs://test-token-uri",
            "ipfs://test-registry-uri", 
            keccak256("test-data-hash")
        );
        
        // Set project to BASELINED state (1) so it can be used
        projectNFT.setProjectState(projectId, 1);
        
        // Create verification criteria
        string[] memory requiredEvidenceTypes = new string[](2);
        requiredEvidenceTypes[0] = "WATER_MEASUREMENT_DATA";
        requiredEvidenceTypes[1] = "GPS_COORDINATES";
        
        address[] memory approvedValidators = new address[](1);
        approvedValidators[0] = verifier;
        
        MethodRegistry.VerificationCriteria memory criteria = MethodRegistry.VerificationCriteria({
            minimumConfidence: 8000, // 80%
            validationPeriod: 30 days,
            approvedValidators: approvedValidators,
            requiredEvidenceTypes: requiredEvidenceTypes,
            minValidators: 1
        });

        methodRegistry.registerMethod(
            methodId, 
            methodHash, 
            "ipfs://test", 
            0, 
            1, 
            "Test Method",
            criteria
        );
        
        vm.stopPrank();
    }
    
    function test_ConfigureIssuance() public {
        // First configuration should succeed
        vm.prank(admin);
        liftTokens.configureIssuance(
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
            uint256 targetTokens,
            uint256 minTokens,
            uint256 maxTokens,
            address storedEscrow,
            uint256 nonce,
            bool issuanceCertified,
            bool configured
        ) = liftTokens.issuanceConfigs(projectId);
        
        assertEq(storedMethodId, methodId);
        assertEq(storedMethodHash, methodHash);
        assertEq(targetTokens, 100000);
        assertEq(minTokens, 80000);
        assertEq(maxTokens, 120000);
        assertEq(storedEscrow, escrow);
        assertEq(nonce, 0);
        assertFalse(issuanceCertified);
        assertTrue(configured);  // Should be true after configuration
    }
    
    function test_ConfigureIssuance_CannotReconfigure() public {
        // Configure once
        vm.prank(admin);
        liftTokens.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
        
        // Try to configure again - should fail
        vm.prank(admin);
        vm.expectRevert("already-configured");
        liftTokens.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            200000, 
            160000, 
            240000, 
            escrow
        );
    }
    
    function test_SubmitVerification() public {
        // First configure the project
        vm.prank(admin);
        liftTokens.configureIssuance(
            projectId, 
            methodId, 
            methodHash, 
            100000, 
            80000, 
            120000, 
            escrow
        );
        
        bytes32 evidenceHash = keccak256("evidence-data");
        bytes32 verificationCid = keccak256("verification-cid");
        
        // Submit verification
        vm.prank(verifier);
        vm.expectEmit(true, true, true, true);
        emit LiftTokens.VerificationSubmitted(projectId, methodId, verifier, evidenceHash);
        
        liftTokens.submitVerification(projectId, evidenceHash, verificationCid);
        
        // Check verification status
        (bool finalVerification, uint256 resultCount, uint256 verifiedAt) = liftTokens.getVerificationStatus(projectId);
        assertFalse(finalVerification);
        assertEq(resultCount, 1);
        assertEq(verifiedAt, 0);
        
        // Check verification result
        LiftTokens.VerificationResult memory result = liftTokens.getVerificationResult(projectId, 0);
        assertFalse(result.verified);
        assertEq(result.confidenceScore, 0);
        assertEq(result.evidenceHash, evidenceHash);
        assertEq(result.validator, verifier);
        assertEq(result.verificationCid, verificationCid);
    }
    
    function test_CompleteVerification() public {
        // Configure and submit verification first
        vm.prank(admin);
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        bytes32 evidenceHash = keccak256("evidence-data");
        bytes32 verificationCid = keccak256("verification-cid");
        
        vm.prank(verifier);
        liftTokens.submitVerification(projectId, evidenceHash, verificationCid);
        
        // Complete verification
        vm.prank(verifier);
        vm.expectEmit(true, true, false, true);
        emit LiftTokens.VerificationCompleted(projectId, methodId, true, 9000);
        
        liftTokens.completeVerification(projectId, 0, true, 9000);
        
        // Check that verification is now complete and final
        (bool finalVerification, uint256 resultCount, uint256 verifiedAt) = liftTokens.getVerificationStatus(projectId);
        assertTrue(finalVerification);
        assertEq(resultCount, 1);
        assertGt(verifiedAt, 0);
        
        // Check verification result
        LiftTokens.VerificationResult memory result = liftTokens.getVerificationResult(projectId, 0);
        assertTrue(result.verified);
        assertEq(result.confidenceScore, 9000);
    }
    
    function test_CompleteVerification_BelowThreshold() public {
        // Configure and submit verification first
        vm.prank(admin);
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        bytes32 evidenceHash = keccak256("evidence-data");
        bytes32 verificationCid = keccak256("verification-cid");
        
        vm.prank(verifier);
        liftTokens.submitVerification(projectId, evidenceHash, verificationCid);
        
        // Complete verification with low confidence (below 80% threshold)
        vm.prank(verifier);
        liftTokens.completeVerification(projectId, 0, true, 7000);
        
        // Check that verification is NOT final due to low confidence
        (bool finalVerification, , ) = liftTokens.getVerificationStatus(projectId);
        assertFalse(finalVerification);
    }
    
    function test_isProjectVerified() public {
        // Initially not verified
        assertFalse(liftTokens.isProjectVerified(projectId));
        
        // Configure, submit, and complete verification
        vm.prank(admin);
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        vm.prank(verifier);
        liftTokens.submitVerification(projectId, keccak256("evidence"), keccak256("cid"));
        
        vm.prank(verifier);
        liftTokens.completeVerification(projectId, 0, true, 9000);
        
        // Now should be verified
        assertTrue(liftTokens.isProjectVerified(projectId));
    }
    
    function test_CannotReuseEvidence() public {
        vm.prank(admin);
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        bytes32 evidenceHash = keccak256("evidence-data");
        
        // Submit verification once
        vm.prank(verifier);
        liftTokens.submitVerification(projectId, evidenceHash, keccak256("cid1"));
        
        // Try to reuse same evidence - should fail
        vm.prank(verifier);
        vm.expectRevert("evidence-already-used");
        liftTokens.submitVerification(projectId, evidenceHash, keccak256("cid2"));
    }
    
    function test_GetTokenStats() public {
        // Initially all stats should be 0
        (uint256 totalMinted, uint256 totalRetiredAmount, uint256 circulating) = liftTokens.getTokenStats(1);
        assertEq(totalMinted, 0);
        assertEq(totalRetiredAmount, 0);
        assertEq(circulating, 0);
    }
    
    function test_AccessControl() public {
        address unauthorized = address(0x4);
        
        // Should fail without PROJECT_ADMIN_ROLE
        vm.prank(unauthorized);
        vm.expectRevert();
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        // Should fail without VERIFIER_ROLE
        vm.prank(admin);
        liftTokens.configureIssuance(projectId, methodId, methodHash, 100000, 80000, 120000, escrow);
        
        vm.prank(unauthorized);
        vm.expectRevert();
        liftTokens.submitVerification(projectId, keccak256("evidence"), keccak256("cid"));
    }
}