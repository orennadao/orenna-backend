// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MethodRegistry
 * @notice Registry for ecosystem improvement measurement methods
 */
contract MethodRegistry is AccessControl {
    bytes32 public constant TECHNICAL_COMMITTEE_ROLE = keccak256("TECHNICAL_COMMITTEE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    struct MethodSpec {
        bytes32 id;
        bytes32 hash;
        string uri;
        bool active;
        uint64 majorVersion;
        uint64 minorVersion;
        uint64 createdAt;
        address proposedBy;
    }

    // Events
    event MethodRegistered(bytes32 indexed methodId, bytes32 hash, string uri, uint64 majorVersion, uint64 minorVersion, address proposedBy);
    event MethodDeactivated(bytes32 indexed methodId, address deactivatedBy);
    event MethodReactivated(bytes32 indexed methodId, address reactivatedBy);

    // State - use internal mapping and public getter
    mapping(bytes32 => MethodSpec) internal _methods;
    mapping(string => bytes32) public methodNameToId;
    bytes32[] public allMethodIds;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TECHNICAL_COMMITTEE_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    function registerMethod(
        bytes32 methodId,
        bytes32 methodHash,
        string calldata uri,
        uint64 majorVersion,
        uint64 minorVersion,
        string calldata name
    ) external {
        require(methodId != bytes32(0), "invalid-method-id");
        require(methodHash != bytes32(0), "invalid-method-hash");
        require(bytes(uri).length > 0, "invalid-uri");
        require(!_methods[methodId].active, "method-exists");

        // Role check
        if (majorVersion > 0) {
            require(hasRole(GOVERNANCE_ROLE, msg.sender), "governance-required");
        } else {
            require(hasRole(TECHNICAL_COMMITTEE_ROLE, msg.sender), "tech-committee-required");
        }

        _methods[methodId] = MethodSpec({
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

    function methods(bytes32 methodId) external view returns (MethodSpec memory) {
        return _methods[methodId];
    }

    function isActive(bytes32 methodId) external view returns (bool) {
        return _methods[methodId].active;
    }

    function methodExists(bytes32 methodId) external view returns (bool) {
        return _methods[methodId].id != bytes32(0);
    }

    function deactivateMethod(bytes32 methodId) external onlyRole(GOVERNANCE_ROLE) {
        require(_methods[methodId].active, "method-not-active");
        _methods[methodId].active = false;
        emit MethodDeactivated(methodId, msg.sender);
    }

    function reactivateMethod(bytes32 methodId) external onlyRole(GOVERNANCE_ROLE) {
        require(_methods[methodId].id != bytes32(0), "method-not-exists");
        require(!_methods[methodId].active, "method-already-active");
        _methods[methodId].active = true;
        emit MethodReactivated(methodId, msg.sender);
    }

    function getMethodByName(string calldata name) external view returns (MethodSpec memory) {
        bytes32 methodId = methodNameToId[name];
        require(methodId != bytes32(0), "method-not-found");
        return _methods[methodId];
    }

    function getAllMethodIds() external view returns (bytes32[] memory) {
        return allMethodIds;
    }
}
