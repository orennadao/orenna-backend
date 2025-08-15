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
