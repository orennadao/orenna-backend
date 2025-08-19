// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IProjectNFT} from "./interfaces/IProjectNFT.sol";

contract ProjectNFT is 
    Initializable,
    ERC721Upgradeable, 
    UUPSUpgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    IProjectNFT 
{
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private _nextId;
    uint256 public constant CURRENT_SCHEMA_VERSION = 1;
    mapping(uint256 => ProjectInfo) private _projects;
    
    modifier projectExists(uint256 projectId) {
        require(_ownerOf(projectId) != address(0), "Project does not exist");
        _;
    }

    function initialize(address admin) public initializer {
        __ERC721_init("Orenna Project", "ORP");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _nextId = 1;
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function createProject(
        address projectOwner,
        string calldata tokenURI_,
        string calldata registryDataURI_,
        bytes32 dataHash_
    ) external onlyRole(REGISTRY_ADMIN_ROLE) whenNotPaused returns (uint256 projectId) {
        require(projectOwner != address(0), "Invalid project owner");
        require(bytes(tokenURI_).length > 0, "Token URI required");
        require(bytes(registryDataURI_).length > 0, "Registry data URI required");
        require(dataHash_ != bytes32(0), "Data hash required");

        projectId = _nextId++;
        _safeMint(projectOwner, projectId);

        _projects[projectId] = ProjectInfo({
            projectId: projectId,
            owner: projectOwner,
            tokenURI: tokenURI_,
            registryDataURI: registryDataURI_,
            dataHash: dataHash_,
            state: 0, // DRAFT
            schemaVersion: CURRENT_SCHEMA_VERSION
        });

        bytes32 projectOwnerRole = _getProjectOwnerRole(projectId);
        _grantRole(projectOwnerRole, projectOwner);

        emit ProjectCreated(projectId, projectOwner, tokenURI_, registryDataURI_, dataHash_, CURRENT_SCHEMA_VERSION);
    }

    function createProjectsBatch(
        address[] calldata projectOwners,
        string[] calldata tokenURIs,
        string[] calldata registryDataURIs,
        bytes32[] calldata dataHashes
    ) external onlyRole(REGISTRY_ADMIN_ROLE) whenNotPaused returns (uint256[] memory projectIds) {
        require(
            projectOwners.length == tokenURIs.length &&
            tokenURIs.length == registryDataURIs.length &&
            registryDataURIs.length == dataHashes.length,
            "Array length mismatch"
        );

        projectIds = new uint256[](projectOwners.length);
        
        for (uint256 i = 0; i < projectOwners.length; i++) {
            require(projectOwners[i] != address(0), "Invalid project owner");
            require(bytes(tokenURIs[i]).length > 0, "Token URI required");
            require(bytes(registryDataURIs[i]).length > 0, "Registry data URI required");
            require(dataHashes[i] != bytes32(0), "Data hash required");

            uint256 projectId = _nextId++;
            _safeMint(projectOwners[i], projectId);

            _projects[projectId] = ProjectInfo({
                projectId: projectId,
                owner: projectOwners[i],
                tokenURI: tokenURIs[i],
                registryDataURI: registryDataURIs[i],
                dataHash: dataHashes[i],
                state: 0, // DRAFT
                schemaVersion: CURRENT_SCHEMA_VERSION
            });

            bytes32 projectOwnerRole = _getProjectOwnerRole(projectId);
            _grantRole(projectOwnerRole, projectOwners[i]);

            emit ProjectCreated(projectId, projectOwners[i], tokenURIs[i], registryDataURIs[i], dataHashes[i], CURRENT_SCHEMA_VERSION);
            projectIds[i] = projectId;
        }
    }

    function setProjectState(uint256 projectId, uint8 newState) 
        external 
        projectExists(projectId)
        whenNotPaused 
    {
        require(
            hasRole(REGISTRY_ADMIN_ROLE, msg.sender) || 
            hasRole(_getProjectOwnerRole(projectId), msg.sender),
            "Insufficient permissions"
        );

        uint8 currentState = _projects[projectId].state;
        require(_isValidStateTransition(currentState, newState), "Invalid state transition");

        _projects[projectId].state = newState;
        emit ProjectStateChanged(projectId, currentState, newState);
    }

    function setProjectStatesBatch(uint256[] calldata projectIds, uint8[] calldata newStates) 
        external 
        onlyRole(REGISTRY_ADMIN_ROLE) 
        whenNotPaused 
    {
        require(projectIds.length == newStates.length, "Array length mismatch");
        
        for (uint256 i = 0; i < projectIds.length; i++) {
            uint256 projectId = projectIds[i];
            uint8 newState = newStates[i];
            
            require(_ownerOf(projectId) != address(0), "Project does not exist");
            
            uint8 currentState = _projects[projectId].state;
            require(_isValidStateTransition(currentState, newState), "Invalid state transition");

            _projects[projectId].state = newState;
            emit ProjectStateChanged(projectId, currentState, newState);
        }
    }

    function updateURIs(
        uint256 projectId, 
        string calldata tokenURI_, 
        string calldata registryDataURI_, 
        bytes32 dataHash_
    ) external projectExists(projectId) whenNotPaused {
        require(
            hasRole(REGISTRY_ADMIN_ROLE, msg.sender) || 
            hasRole(_getProjectOwnerRole(projectId), msg.sender),
            "Insufficient permissions"
        );
        require(bytes(tokenURI_).length > 0, "Token URI required");
        require(bytes(registryDataURI_).length > 0, "Registry data URI required");
        require(dataHash_ != bytes32(0), "Data hash required");

        _projects[projectId].tokenURI = tokenURI_;
        _projects[projectId].registryDataURI = registryDataURI_;
        _projects[projectId].dataHash = dataHash_;

        emit ProjectURIsUpdated(projectId, tokenURI_, registryDataURI_, dataHash_, _projects[projectId].schemaVersion);
    }

    function attestVerification(
        uint256 projectId, 
        uint256 round, 
        bytes32 reportHash, 
        string calldata reportURI
    ) external onlyRole(VERIFIER_ROLE) projectExists(projectId) whenNotPaused {
        require(round > 0, "Invalid round");
        require(reportHash != bytes32(0), "Report hash required");
        require(bytes(reportURI).length > 0, "Report URI required");

        emit VerifierAttested(projectId, round, reportHash, reportURI);
    }

    function linkForward(uint256 projectId, bytes32 forwardId) 
        external 
        projectExists(projectId) 
        whenNotPaused 
    {
        require(forwardId != bytes32(0), "Invalid forward ID");
        emit ForwardLinked(projectId, forwardId);
    }

    function linkLiftBatch(uint256 projectId, uint256 batchId, uint256 amount) 
        external 
        projectExists(projectId) 
        whenNotPaused 
    {
        require(batchId > 0, "Invalid batch ID");
        require(amount > 0, "Invalid amount");
        emit LiftBatchLinked(projectId, batchId, amount);
    }

    function recordRetirement(
        uint256 projectId, 
        address beneficiary, 
        uint256 batchId, 
        uint256 amount, 
        bytes32 receiptHash
    ) external projectExists(projectId) whenNotPaused {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(batchId > 0, "Invalid batch ID");
        require(amount > 0, "Invalid amount");
        require(receiptHash != bytes32(0), "Receipt hash required");

        emit RetiredAgainstProject(projectId, beneficiary, batchId, amount, receiptHash);
    }

    function _getProjectOwnerRole(uint256 projectId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("PROJECT_OWNER_", projectId));
    }

    function _isValidStateTransition(uint8 from, uint8 to) internal pure returns (bool) {
        // State definitions from spec:
        // 0 DRAFT
        // 1 BASELINED
        // 2 ACTIVE_FUNDRAISING
        // 3 IMPLEMENTATION
        // 4 MONITORING
        // 5 VERIFIED_ROUND_N (5+ for multiple rounds)
        // 6 ARCHIVED
        // 7 CANCELLED

        // Allow cancellation from any state except ARCHIVED
        if (to == 7 && from != 6) return true;
        
        // Allow archiving from VERIFIED states or COMPLETED states
        if (to == 6 && (from >= 5 || from == 4)) return true;
        
        // Forward progression
        if (to == from + 1 && from < 7) return true;
        
        // Allow skipping to higher VERIFIED_ROUND states (5+)
        if (to >= 5 && from >= 4 && to > from) return true;
        
        // Special transitions
        if (from == 0 && to == 1) return true; // DRAFT -> BASELINED
        if (from == 1 && to == 2) return true; // BASELINED -> ACTIVE_FUNDRAISING
        if (from == 2 && to == 3) return true; // ACTIVE_FUNDRAISING -> IMPLEMENTATION
        if (from == 3 && to == 4) return true; // IMPLEMENTATION -> MONITORING
        if (from == 4 && to >= 5) return true; // MONITORING -> VERIFIED_ROUND_N
        
        return false;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return _projects[tokenId].tokenURI;
    }

    function info(uint256 projectId) external view projectExists(projectId) returns (ProjectInfo memory) {
        return _projects[projectId];
    }

    function getProjectState(uint256 projectId) external view projectExists(projectId) returns (uint8) {
        return _projects[projectId].state;
    }

    function getProjectOwner(uint256 projectId) external view projectExists(projectId) returns (address) {
        return _projects[projectId].owner;
    }

    function getDataHash(uint256 projectId) external view projectExists(projectId) returns (bytes32) {
        return _projects[projectId].dataHash;
    }

    function getRegistryDataURI(uint256 projectId) external view projectExists(projectId) returns (string memory) {
        return _projects[projectId].registryDataURI;
    }

    function totalProjects() external view returns (uint256) {
        return _nextId - 1;
    }

    function isProjectInState(uint256 projectId, uint8 state) external view projectExists(projectId) returns (bool) {
        return _projects[projectId].state == state;
    }

    function isProjectOwner(uint256 projectId, address account) external view projectExists(projectId) returns (bool) {
        return hasRole(_getProjectOwnerRole(projectId), account);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        require(!paused(), "Token transfers paused");
        
        address from = _ownerOf(tokenId);
        address previousOwner = super._update(to, tokenId, auth);
        
        // Update project owner when transferred
        if (from != address(0) && to != address(0) && from != to) {
            bytes32 projectOwnerRole = _getProjectOwnerRole(tokenId);
            if (hasRole(projectOwnerRole, from)) {
                _revokeRole(projectOwnerRole, from);
                _grantRole(projectOwnerRole, to);
                _projects[tokenId].owner = to;
            }
        }
        
        return previousOwner;
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC721Upgradeable, AccessControlUpgradeable) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}