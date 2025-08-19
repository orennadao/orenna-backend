// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MethodRegistry} from "./MethodRegistry.sol";
import {IProjectNFT} from "./interfaces/IProjectNFT.sol";

contract LiftTokens is ERC1155, EIP712, AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PROJECT_ADMIN_ROLE = keccak256("PROJECT_ADMIN_ROLE");

    bytes32 public constant ISSUANCE_TYPEHASH = keccak256(
        "Issuance(uint256 projectId,bytes32 methodId,bytes32 methodHash,bytes32 certificateCid,uint256[] tokenIds,uint256[] amounts,uint256 nonce)"
    );

    struct Issuance {
        uint256 projectId;
        bytes32 methodId;
        bytes32 methodHash;
        bytes32 certificateCid;
        uint256[] tokenIds;
        uint256[] amounts;
        uint256 nonce;
    }

    struct IssuanceConfig {
        bytes32 methodId;
        bytes32 methodHash;
        uint256 targetTokens;
        uint256 minTokens;
        uint256 maxTokens;
        address allocationEscrow;
        uint256 nonce;
        bool issuanceCertified;
        bool configured;  // Track if configuration exists
    }

    struct VerificationResult {
        bool verified;
        uint256 confidenceScore; // basis points (e.g., 8500 = 85%)
        bytes32 evidenceHash;
        uint256 timestamp;
        address validator;
        bytes32 verificationCid; // IPFS hash of verification data
    }

    struct LiftTokenVerification {
        uint256 projectId;
        bytes32 methodId;
        VerificationResult[] results;
        bool finalVerification; // true if verification is complete
        uint256 verifiedAt;
    }

    event VerifiedIssuance(
        uint256 indexed projectId,
        bytes32 certificateCid,
        uint256[] tokenIds,
        uint256[] amounts,
        uint256 totalIssued
    );
    
    event Retired(
        uint256 indexed tokenId,
        uint256 amount,
        address indexed retiree,
        bytes32 retirementNoteCid
    );

    event VerificationSubmitted(
        uint256 indexed projectId,
        bytes32 indexed methodId,
        address indexed validator,
        bytes32 evidenceHash
    );

    event VerificationCompleted(
        uint256 indexed projectId,
        bytes32 indexed methodId,
        bool verified,
        uint256 confidenceScore
    );

    MethodRegistry public immutable methodRegistry;
    IProjectNFT public immutable projectNFT;
    mapping(uint256 => IssuanceConfig) public issuanceConfigs;
    mapping(uint256 => string) public tokenURIs;
    mapping(uint256 => uint256) public totalSupply;
    mapping(uint256 => uint256) public totalRetired;
    mapping(uint256 => LiftTokenVerification) public verifications;
    mapping(bytes32 => bool) public usedEvidenceHashes; // prevent evidence reuse
    mapping(uint256 => uint256) public batchProjectMapping; // batchId -> projectId

    constructor(string memory uri, MethodRegistry _methodRegistry, IProjectNFT _projectNFT) 
        ERC1155(uri) 
        EIP712("LiftTokens", "1") 
    {
        methodRegistry = _methodRegistry;
        projectNFT = _projectNFT;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function configureIssuance(
        uint256 projectId,
        bytes32 methodId,
        bytes32 methodHash,
        uint256 targetTokens,
        uint256 minTokens,
        uint256 maxTokens,
        address allocationEscrow
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        require(!issuanceConfigs[projectId].configured, "already-configured");
        require(targetTokens > 0, "invalid-target");
        require(minTokens <= targetTokens, "min-exceeds-target");
        require(maxTokens >= targetTokens, "max-below-target");
        require(allocationEscrow != address(0), "invalid-escrow");
        
        // Check project exists and is in valid state for configuration
        uint8 projectState = projectNFT.getProjectState(projectId);
        require(projectState >= 1, "project-not-baselined"); // Must be BASELINED or later

        MethodRegistry.MethodSpec memory method = methodRegistry.methods(methodId);
        require(method.active, "method-inactive");
        require(method.hash == methodHash, "method-hash-mismatch");

        issuanceConfigs[projectId] = IssuanceConfig({
            methodId: methodId,
            methodHash: methodHash,
            targetTokens: targetTokens,
            minTokens: minTokens,
            maxTokens: maxTokens,
            allocationEscrow: allocationEscrow,
            nonce: 0,
            issuanceCertified: false,
            configured: true  // Mark as configured
        });
    }

    function mintVerifiedBatch(
        uint256 projectId,
        uint256 batchId,
        uint256 amount,
        address recipient,
        string calldata tokenURI
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        require(amount > 0, "invalid-amount");
        require(recipient != address(0), "invalid-recipient");
        require(bytes(tokenURI).length > 0, "token-uri-required");
        
        // Check project exists and is verified
        uint8 projectState = projectNFT.getProjectState(projectId);
        require(
            projectState >= 5 || projectState == 4, // VERIFIED_ROUND_N or MONITORING (if policy allows)
            "project-not-verified"
        );
        
        // Check project has completed verification
        require(verifications[projectId].finalVerification, "verification-incomplete");
        
        // Mint tokens
        _mint(recipient, batchId, amount, "");
        totalSupply[batchId] += amount;
        tokenURIs[batchId] = tokenURI;
        batchProjectMapping[batchId] = projectId;
        
        // Link batch to project
        projectNFT.linkLiftBatch(projectId, batchId, amount);
        
        emit VerifiedIssuance(
            projectId,
            bytes32(0), // certificateCid - could be added later
            _asSingletonArray(batchId),
            _asSingletonArray(amount),
            amount
        );
    }

    function retire(uint256 tokenId, uint256 amount, bytes32 retirementNoteCid) external {
        require(amount > 0, "invalid-amount");
        require(balanceOf(msg.sender, tokenId) >= amount, "insufficient-balance");

        _burn(msg.sender, tokenId, amount);
        totalRetired[tokenId] += amount;
        
        // Record retirement against project if batch is linked
        uint256 projectId = batchProjectMapping[tokenId];
        if (projectId > 0) {
            projectNFT.recordRetirement(projectId, msg.sender, tokenId, amount, retirementNoteCid);
        }

        emit Retired(tokenId, amount, msg.sender, retirementNoteCid);
    }

    function getTokenStats(uint256 tokenId) external view returns (
        uint256 totalMinted,
        uint256 totalRetiredAmount,
        uint256 circulating
    ) {
        totalMinted = totalSupply[tokenId];
        totalRetiredAmount = totalRetired[tokenId];
        circulating = totalMinted - totalRetiredAmount;
    }

    function submitVerification(
        uint256 projectId,
        bytes32 evidenceHash,
        bytes32 verificationCid
    ) external onlyRole(VERIFIER_ROLE) {
        require(issuanceConfigs[projectId].configured, "project-not-configured");
        require(evidenceHash != bytes32(0), "invalid-evidence-hash");
        require(!usedEvidenceHashes[evidenceHash], "evidence-already-used");
        
        bytes32 methodId = issuanceConfigs[projectId].methodId;
        require(methodRegistry.isApprovedValidator(methodId, msg.sender), "validator-not-approved");

        // Mark evidence as used
        usedEvidenceHashes[evidenceHash] = true;

        // Initialize verification if not exists
        if (verifications[projectId].methodId == bytes32(0)) {
            verifications[projectId].projectId = projectId;
            verifications[projectId].methodId = methodId;
        }

        // Add verification result
        verifications[projectId].results.push(VerificationResult({
            verified: false, // initially pending
            confidenceScore: 0,
            evidenceHash: evidenceHash,
            timestamp: block.timestamp,
            validator: msg.sender,
            verificationCid: verificationCid
        }));

        emit VerificationSubmitted(projectId, methodId, msg.sender, evidenceHash);
    }

    function completeVerification(
        uint256 projectId,
        uint256 resultIndex,
        bool verified,
        uint256 confidenceScore
    ) external onlyRole(VERIFIER_ROLE) {
        require(verifications[projectId].results.length > resultIndex, "invalid-result-index");
        require(confidenceScore <= 10000, "invalid-confidence-score");
        
        VerificationResult storage result = verifications[projectId].results[resultIndex];
        require(result.validator == msg.sender, "not-validator");
        require(result.confidenceScore == 0, "already-completed");

        result.verified = verified;
        result.confidenceScore = confidenceScore;

        // Check if verification meets method criteria
        bytes32 methodId = verifications[projectId].methodId;
        MethodRegistry.VerificationCriteria memory criteria = methodRegistry.getVerificationCriteria(methodId);
        
        if (verified && confidenceScore >= criteria.minimumConfidence) {
            _checkFinalVerification(projectId, criteria);
        }

        emit VerificationCompleted(projectId, methodId, verified, confidenceScore);
    }

    function _checkFinalVerification(uint256 projectId, MethodRegistry.VerificationCriteria memory criteria) internal {
        LiftTokenVerification storage verification = verifications[projectId];
        
        // Count verified results that meet confidence threshold
        uint256 validVerifications = 0;
        for (uint256 i = 0; i < verification.results.length; i++) {
            if (verification.results[i].verified && 
                verification.results[i].confidenceScore >= criteria.minimumConfidence) {
                validVerifications++;
            }
        }

        // Check if minimum validators requirement is met
        if (validVerifications >= criteria.minValidators) {
            verification.finalVerification = true;
            verification.verifiedAt = block.timestamp;
        }
    }

    function getVerificationStatus(uint256 projectId) external view returns (
        bool finalVerification,
        uint256 resultCount,
        uint256 verifiedAt
    ) {
        LiftTokenVerification storage verification = verifications[projectId];
        return (
            verification.finalVerification,
            verification.results.length,
            verification.verifiedAt
        );
    }

    function getVerificationResult(uint256 projectId, uint256 resultIndex) 
        external 
        view 
        returns (VerificationResult memory) 
    {
        require(verifications[projectId].results.length > resultIndex, "invalid-result-index");
        return verifications[projectId].results[resultIndex];
    }

    function isProjectVerified(uint256 projectId) external view returns (bool) {
        return verifications[projectId].finalVerification;
    }

    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;
        return array;
    }

    function getProjectForBatch(uint256 batchId) external view returns (uint256) {
        return batchProjectMapping[batchId];
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC1155, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}