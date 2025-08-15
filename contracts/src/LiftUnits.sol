// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MethodRegistry} from "./MethodRegistry.sol";

contract LiftUnits is ERC1155, EIP712, AccessControl, ReentrancyGuard {
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
        uint256 targetUnits;
        uint256 minUnits;
        uint256 maxUnits;
        address allocationEscrow;
        uint256 nonce;
        bool issuanceCertified;
        bool configured;  // Track if configuration exists
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

    MethodRegistry public immutable methodRegistry;
    mapping(uint256 => IssuanceConfig) public issuanceConfigs;
    mapping(uint256 => string) public tokenURIs;
    mapping(uint256 => uint256) public totalSupply;
    mapping(uint256 => uint256) public totalRetired;

    constructor(string memory uri, MethodRegistry _methodRegistry) 
        ERC1155(uri) 
        EIP712("LiftUnits", "1") 
    {
        methodRegistry = _methodRegistry;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function configureIssuance(
        uint256 projectId,
        bytes32 methodId,
        bytes32 methodHash,
        uint256 targetUnits,
        uint256 minUnits,
        uint256 maxUnits,
        address allocationEscrow
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        require(!issuanceConfigs[projectId].configured, "already-configured");
        require(targetUnits > 0, "invalid-target");
        require(minUnits <= targetUnits, "min-exceeds-target");
        require(maxUnits >= targetUnits, "max-below-target");
        require(allocationEscrow != address(0), "invalid-escrow");

        MethodRegistry.MethodSpec memory method = methodRegistry.methods(methodId);
        require(method.active, "method-inactive");
        require(method.hash == methodHash, "method-hash-mismatch");

        issuanceConfigs[projectId] = IssuanceConfig({
            methodId: methodId,
            methodHash: methodHash,
            targetUnits: targetUnits,
            minUnits: minUnits,
            maxUnits: maxUnits,
            allocationEscrow: allocationEscrow,
            nonce: 0,
            issuanceCertified: false,
            configured: true  // Mark as configured
        });
    }

    function retire(uint256 tokenId, uint256 amount, bytes32 retirementNoteCid) external {
        require(amount > 0, "invalid-amount");
        require(balanceOf(msg.sender, tokenId) >= amount, "insufficient-balance");

        _burn(msg.sender, tokenId, amount);
        totalRetired[tokenId] += amount;

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

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC1155, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
