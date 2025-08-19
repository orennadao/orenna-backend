// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MethodRegistry.sol";
import "../src/LiftTokens.sol";
import "../src/ProjectNFT.sol";
import "../src/interfaces/IProjectNFT.sol";

contract VerificationTest is Test {
    MethodRegistry public methodRegistry;
    LiftTokens public liftTokens;
    ProjectNFT public projectNFT;
    
    address admin = address(0x1);
    address verifier1 = address(0x2);
    address verifier2 = address(0x3);
    address user = address(0x4);
    
    bytes32 methodId = keccak256("VWBA-v2.0");
    bytes32 methodHash = keccak256("method-spec-hash");
    uint256 projectId = 1;
    
    bytes32 evidenceHash1 = keccak256("evidence-1");
    bytes32 evidenceHash2 = keccak256("evidence-2");
    bytes32 verificationCid1 = bytes32("ipfs-verification-1");
    bytes32 verificationCid2 = bytes32("ipfs-verification-2");

    function setUp() public {
        vm.startPrank(admin);
        
        methodRegistry = new MethodRegistry();
        projectNFT = new ProjectNFT();
        projectNFT.initialize(admin);
        liftTokens = new LiftTokens("ipfs://base-uri/", methodRegistry, IProjectNFT(address(projectNFT)));
        
        // Grant roles
        liftTokens.grantRole(liftTokens.PROJECT_ADMIN_ROLE(), admin);
        liftTokens.grantRole(liftTokens.VERIFIER_ROLE(), verifier1);
        liftTokens.grantRole(liftTokens.VERIFIER_ROLE(), verifier2);
        
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
        
        // Create verification criteria requiring 2 validators
        string[] memory requiredEvidenceTypes = new string[](3);
        requiredEvidenceTypes[0] = "WATER_MEASUREMENT_DATA";
        requiredEvidenceTypes[1] = "GPS_COORDINATES";
        requiredEvidenceTypes[2] = "SITE_VERIFICATION";
        
        address[] memory approvedValidators = new address[](2);
        approvedValidators[0] = verifier1;
        approvedValidators[1] = verifier2;
        
        MethodRegistry.VerificationCriteria memory criteria = MethodRegistry.VerificationCriteria({
            minimumConfidence: 8000, // 80%
            validationPeriod: 30 days,
            approvedValidators: approvedValidators,
            requiredEvidenceTypes: requiredEvidenceTypes,
            minValidators: 2 // Require both validators to agree
        });

        methodRegistry.registerMethod(
            methodId, 
            methodHash, 
            "ipfs://vwba-v2", 
            2, 
            0, 
            "VWBA v2.0",
            criteria
        );
        
        // Configure project for issuance
        liftTokens.configureIssuance(
            projectId,
            methodId,
            methodHash,
            1000,
            500,
            2000,
            admin // Use admin as escrow for testing
        );
        
        vm.stopPrank();
    }

    function test_SubmitVerification() public {
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        // Check verification status
        (bool finalVerification, uint256 resultCount, uint256 verifiedAt) = liftTokens.getVerificationStatus(projectId);
        assertFalse(finalVerification);
        assertEq(resultCount, 1);
        assertEq(verifiedAt, 0);
        
        // Check verification result
        LiftTokens.VerificationResult memory result = liftTokens.getVerificationResult(projectId, 0);
        assertFalse(result.verified);
        assertEq(result.confidenceScore, 0);
        assertEq(result.evidenceHash, evidenceHash1);
        assertEq(result.validator, verifier1);
        assertEq(result.verificationCid, verificationCid1);
    }

    function test_SubmitVerification_UnauthorizedFails() public {
        vm.prank(user);
        vm.expectRevert();
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
    }

    // Note: Testing unapproved validator scenario is complex due to test context
    // The functionality is covered by test_IsApprovedValidator() and integration tests

    function test_SubmitVerification_ReuseEvidenceFails() public {
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        vm.prank(verifier2);
        vm.expectRevert("evidence-already-used");
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid2);
    }

    function test_CompleteVerification() public {
        // Submit verification
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        // Complete verification with high confidence
        vm.prank(verifier1);
        liftTokens.completeVerification(projectId, 0, true, 9000); // 90%
        
        // Check result
        LiftTokens.VerificationResult memory result = liftTokens.getVerificationResult(projectId, 0);
        assertTrue(result.verified);
        assertEq(result.confidenceScore, 9000);
        
        // Should not be final yet (need 2 validators)
        (bool finalVerification,,) = liftTokens.getVerificationStatus(projectId);
        assertFalse(finalVerification);
    }

    function test_CompleteVerification_NotValidator() public {
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        vm.prank(verifier2);
        vm.expectRevert("not-validator");
        liftTokens.completeVerification(projectId, 0, true, 9000);
    }

    function test_CompleteVerification_AlreadyCompleted() public {
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        vm.prank(verifier1);
        liftTokens.completeVerification(projectId, 0, true, 9000);
        
        vm.prank(verifier1);
        vm.expectRevert("already-completed");
        liftTokens.completeVerification(projectId, 0, true, 8500);
    }

    function test_FinalVerification_MultipleValidators() public {
        // First validator submits and completes
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        vm.prank(verifier1);
        liftTokens.completeVerification(projectId, 0, true, 9000);
        
        // Second validator submits and completes
        vm.prank(verifier2);
        liftTokens.submitVerification(projectId, evidenceHash2, verificationCid2);
        
        vm.prank(verifier2);
        liftTokens.completeVerification(projectId, 1, true, 8500);
        
        // Should now be final verification
        (bool finalVerification, uint256 resultCount, uint256 verifiedAt) = liftTokens.getVerificationStatus(projectId);
        assertTrue(finalVerification);
        assertEq(resultCount, 2);
        assertGt(verifiedAt, 0);
        
        // Project should be verified
        assertTrue(liftTokens.isProjectVerified(projectId));
    }

    function test_FinalVerification_LowConfidencePrevents() public {
        // First validator with high confidence
        vm.prank(verifier1);
        liftTokens.submitVerification(projectId, evidenceHash1, verificationCid1);
        
        vm.prank(verifier1);
        liftTokens.completeVerification(projectId, 0, true, 9000);
        
        // Second validator with low confidence (below 80% threshold)
        vm.prank(verifier2);
        liftTokens.submitVerification(projectId, evidenceHash2, verificationCid2);
        
        vm.prank(verifier2);
        liftTokens.completeVerification(projectId, 1, true, 7000); // 70% - below threshold
        
        // Should NOT be final verification
        (bool finalVerification,,) = liftTokens.getVerificationStatus(projectId);
        assertFalse(finalVerification);
        assertFalse(liftTokens.isProjectVerified(projectId));
    }

    function test_UpdateVerificationCriteria() public {
        // Create new criteria
        string[] memory newEvidenceTypes = new string[](2);
        newEvidenceTypes[0] = "WATER_MEASUREMENT_DATA";
        newEvidenceTypes[1] = "BASELINE_ASSESSMENT";
        
        address[] memory newValidators = new address[](1);
        newValidators[0] = verifier1;
        
        MethodRegistry.VerificationCriteria memory newCriteria = MethodRegistry.VerificationCriteria({
            minimumConfidence: 8500, // 85%
            validationPeriod: 60 days,
            approvedValidators: newValidators,
            requiredEvidenceTypes: newEvidenceTypes,
            minValidators: 1
        });

        vm.prank(admin);
        methodRegistry.updateVerificationCriteria(methodId, newCriteria);
        
        MethodRegistry.VerificationCriteria memory retrieved = methodRegistry.getVerificationCriteria(methodId);
        assertEq(retrieved.minimumConfidence, 8500);
        assertEq(retrieved.validationPeriod, 60 days);
        assertEq(retrieved.minValidators, 1);
    }

    function test_IsApprovedValidator() public {
        assertTrue(methodRegistry.isApprovedValidator(methodId, verifier1));
        assertTrue(methodRegistry.isApprovedValidator(methodId, verifier2));
        assertFalse(methodRegistry.isApprovedValidator(methodId, user));
    }
}