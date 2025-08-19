// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProjectNFT {
    struct ProjectInfo {
        uint256 projectId;
        address owner;
        string tokenURI;
        string registryDataURI;
        bytes32 dataHash;
        uint8 state;
        uint256 schemaVersion;
    }

    // Project lifecycle events
    event ProjectCreated(
        uint256 indexed projectId, 
        address indexed owner, 
        string tokenURI, 
        string registryDataURI, 
        bytes32 dataHash, 
        uint256 schemaVersion
    );
    
    event ProjectStateChanged(
        uint256 indexed projectId, 
        uint8 prevState, 
        uint8 newState
    );
    
    event ProjectURIsUpdated(
        uint256 indexed projectId, 
        string tokenURI, 
        string registryDataURI, 
        bytes32 dataHash, 
        uint256 schemaVersion
    );
    
    event VerifierAttested(
        uint256 indexed projectId, 
        uint256 round, 
        bytes32 reportHash, 
        string reportURI
    );
    
    // Cross-contract linking events
    event ForwardLinked(
        uint256 indexed projectId, 
        bytes32 forwardId
    );
    
    event LiftBatchLinked(
        uint256 indexed projectId, 
        uint256 indexed batchId, 
        uint256 amount
    );
    
    event RetiredAgainstProject(
        uint256 indexed projectId, 
        address indexed beneficiary, 
        uint256 indexed batchId, 
        uint256 amount, 
        bytes32 receiptHash
    );

    // Core project management functions
    function createProject(
        address projectOwner, 
        string calldata tokenURI, 
        string calldata registryDataURI, 
        bytes32 dataHash
    ) external returns (uint256 projectId);
    
    function setProjectState(uint256 projectId, uint8 newState) external;
    
    function updateURIs(
        uint256 projectId, 
        string calldata tokenURI, 
        string calldata registryDataURI, 
        bytes32 dataHash
    ) external;
    
    function attestVerification(
        uint256 projectId, 
        uint256 round, 
        bytes32 reportHash, 
        string calldata reportURI
    ) external;
    
    function info(uint256 projectId) external view returns (ProjectInfo memory);
    
    // Batch operations for gas optimization
    function createProjectsBatch(
        address[] calldata projectOwners,
        string[] calldata tokenURIs,
        string[] calldata registryDataURIs,
        bytes32[] calldata dataHashes
    ) external returns (uint256[] memory projectIds);
    
    function setProjectStatesBatch(
        uint256[] calldata projectIds, 
        uint8[] calldata newStates
    ) external;

    // Cross-contract linking functions
    function linkForward(uint256 projectId, bytes32 forwardId) external;
    
    function linkLiftBatch(uint256 projectId, uint256 batchId, uint256 amount) external;
    
    function recordRetirement(
        uint256 projectId, 
        address beneficiary, 
        uint256 batchId, 
        uint256 amount, 
        bytes32 receiptHash
    ) external;

    // View functions
    function getProjectState(uint256 projectId) external view returns (uint8);
    
    function getProjectOwner(uint256 projectId) external view returns (address);
    
    function getDataHash(uint256 projectId) external view returns (bytes32);
    
    function getRegistryDataURI(uint256 projectId) external view returns (string memory);
    
    function totalProjects() external view returns (uint256);
    
    function isProjectInState(uint256 projectId, uint8 state) external view returns (bool);
    
    function isProjectOwner(uint256 projectId, address account) external view returns (bool);
}