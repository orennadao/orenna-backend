// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OrennaGovernor
 * @notice Governance contract for OrennaDAO with ecosystem-specific proposal types
 * @dev Extends OpenZeppelin Governor with custom proposal categorization
 */
contract OrennaGovernor is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction, 
    GovernorTimelockControl,
    AccessControl 
{
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant PARAMETER_UPDATER_ROLE = keccak256("PARAMETER_UPDATER_ROLE");
    
    // Integration with existing OrennaDAO contracts
    address public immutable methodRegistry;
    address public immutable liftTokens;
    address public immutable financeContract;
    
    // Custom proposal types for ecosystem governance
    enum ProposalType {
        Standard,              // Standard governance proposal
        EcosystemParameter,    // Ecosystem measurement parameter changes
        MethodRegistryUpdate,  // Method registry updates  
        ProtocolUpgrade,       // Protocol/contract upgrades
        TreasuryAllocation,    // Treasury fund allocation
        LiftTokenGovernance,   // Lift token minting/burning parameters
        FinancePlatform,       // Finance system parameter changes
        FeeAdjustment,         // Platform fee adjustments
        Emergency              // Emergency proposals (shorter timelock)
    }
    
    // Proposal metadata for ecosystem governance
    struct ProposalMetadata {
        ProposalType proposalType;
        bytes32 ecosystemParameters; // Hash of ecosystem parameter changes
        bytes32 methodData;          // Hash of method registry data
        bytes32 financeData;         // Hash of finance platform data
        bytes32 liftTokenData;       // Hash of lift token data
        bool isEmergency;            // Whether this is an emergency proposal
    }
    
    // Mapping from proposal ID to metadata
    mapping(uint256 => ProposalMetadata) public proposalMetadata;
    
    // Different voting parameters for different proposal types
    mapping(ProposalType => uint256) public proposalTypeQuorum;
    mapping(ProposalType => uint256) public proposalTypeVotingPeriod;
    
    // Events
    event ProposalTypeSet(uint256 indexed proposalId, ProposalType proposalType);
    event EcosystemParameterProposed(uint256 indexed proposalId, bytes32 parameterHash);
    event MethodRegistryUpdateProposed(uint256 indexed proposalId, bytes32 methodHash);
    event EmergencyProposalCreated(uint256 indexed proposalId, address proposer);
    event ProposalTypeQuorumUpdated(ProposalType proposalType, uint256 newQuorum);
    
    /**
     * @dev Constructor
     * @param _token Governance token contract
     * @param _timelock Timelock controller contract
     * @param _methodRegistry Method registry contract
     * @param _liftTokens Lift tokens contract
     * @param _financeContract Finance contract
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _methodRegistry,
        address _liftTokens,
        address _financeContract
    )
        Governor("OrennaGovernor")
        GovernorSettings(
            7200,   // 1 day voting delay (assuming 12s blocks)
            50400,  // 1 week voting period
            100e18  // 100 ORNA proposal threshold (0.01% of max supply)
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {
        require(_methodRegistry != address(0), "Invalid method registry");
        require(_liftTokens != address(0), "Invalid lift tokens");
        require(_financeContract != address(0), "Invalid finance contract");
        
        methodRegistry = _methodRegistry;
        liftTokens = _liftTokens;
        financeContract = _financeContract;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(PARAMETER_UPDATER_ROLE, msg.sender);
        
        // Set default quorum for different proposal types (in basis points)
        proposalTypeQuorum[ProposalType.Standard] = 400; // 4%
        proposalTypeQuorum[ProposalType.EcosystemParameter] = 600; // 6%
        proposalTypeQuorum[ProposalType.MethodRegistryUpdate] = 500; // 5%
        proposalTypeQuorum[ProposalType.ProtocolUpgrade] = 800; // 8%
        proposalTypeQuorum[ProposalType.TreasuryAllocation] = 600; // 6%
        proposalTypeQuorum[ProposalType.LiftTokenGovernance] = 500; // 5%
        proposalTypeQuorum[ProposalType.FinancePlatform] = 400; // 4%
        proposalTypeQuorum[ProposalType.FeeAdjustment] = 300; // 3%
        proposalTypeQuorum[ProposalType.Emergency] = 800; // 8%
        
        // Set voting periods for different proposal types (in blocks)
        proposalTypeVotingPeriod[ProposalType.Standard] = 50400; // 1 week
        proposalTypeVotingPeriod[ProposalType.EcosystemParameter] = 75600; // 1.5 weeks
        proposalTypeVotingPeriod[ProposalType.MethodRegistryUpdate] = 75600; // 1.5 weeks
        proposalTypeVotingPeriod[ProposalType.ProtocolUpgrade] = 100800; // 2 weeks
        proposalTypeVotingPeriod[ProposalType.TreasuryAllocation] = 50400; // 1 week
        proposalTypeVotingPeriod[ProposalType.LiftTokenGovernance] = 50400; // 1 week
        proposalTypeVotingPeriod[ProposalType.FinancePlatform] = 50400; // 1 week
        proposalTypeVotingPeriod[ProposalType.FeeAdjustment] = 25200; // 3.5 days
        proposalTypeVotingPeriod[ProposalType.Emergency] = 14400; // 2 days
    }
    
    /**
     * @dev Create proposal with ecosystem-specific metadata
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param calldatas Array of encoded function calls
     * @param description Proposal description
     * @param proposalType Type of proposal
     * @param ecosystemParameters Hash of ecosystem parameter changes (optional)
     * @param methodData Hash of method registry data (optional)
     * @param financeData Hash of finance platform data (optional)
     * @param liftTokenData Hash of lift token data (optional)
     */
    function proposeWithMetadata(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        bytes32 ecosystemParameters,
        bytes32 methodData,
        bytes32 financeData,
        bytes32 liftTokenData
    ) public returns (uint256) {
        // Create the proposal
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        // Store metadata
        proposalMetadata[proposalId] = ProposalMetadata({
            proposalType: proposalType,
            ecosystemParameters: ecosystemParameters,
            methodData: methodData,
            financeData: financeData,
            liftTokenData: liftTokenData,
            isEmergency: proposalType == ProposalType.Emergency
        });
        
        emit ProposalTypeSet(proposalId, proposalType);
        
        if (proposalType == ProposalType.EcosystemParameter) {
            emit EcosystemParameterProposed(proposalId, ecosystemParameters);
        }
        
        if (proposalType == ProposalType.MethodRegistryUpdate) {
            emit MethodRegistryUpdateProposed(proposalId, methodData);
        }
        
        if (proposalType == ProposalType.Emergency) {
            emit EmergencyProposalCreated(proposalId, msg.sender);
        }
        
        return proposalId;
    }
    
    /**
     * @dev Emergency proposal creation (shorter timelock)
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param calldatas Array of encoded function calls
     * @param description Proposal description
     */
    function proposeEmergency(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyRole(EMERGENCY_ROLE) returns (uint256) {
        return proposeWithMetadata(
            targets,
            values,
            calldatas,
            description,
            ProposalType.Emergency,
            bytes32(0),
            bytes32(0),
            bytes32(0),
            bytes32(0)
        );
    }
    
    /**
     * @dev Update quorum for a proposal type
     * @param proposalType Type of proposal
     * @param newQuorum New quorum in basis points
     */
    function updateProposalTypeQuorum(ProposalType proposalType, uint256 newQuorum) 
        external 
        onlyRole(PARAMETER_UPDATER_ROLE) 
    {
        require(newQuorum <= 10000, "Quorum too high"); // Max 100%
        require(newQuorum >= 100, "Quorum too low");   // Min 1%
        
        proposalTypeQuorum[proposalType] = newQuorum;
        emit ProposalTypeQuorumUpdated(proposalType, newQuorum);
    }
    
    /**
     * @dev Get quorum for a specific proposal (based on type)
     * @param blockNumber Block number to check quorum at
     */
    function quorum(uint256 blockNumber) 
        public 
        view 
        override(Governor, GovernorVotesQuorumFraction) 
        returns (uint256) 
    {
        return super.quorum(blockNumber);
    }
    
    /**
     * @dev Get quorum for a specific proposal type
     * @param proposalId ID of the proposal
     * @param blockNumber Block number to check quorum at
     */
    function proposalQuorum(uint256 proposalId, uint256 blockNumber) 
        public 
        view 
        returns (uint256) 
    {
        ProposalMetadata memory metadata = proposalMetadata[proposalId];
        uint256 typeQuorum = proposalTypeQuorum[metadata.proposalType];
        
        if (typeQuorum == 0) {
            return quorum(blockNumber);
        }
        
        // Calculate quorum based on total supply at block
        return (token().getPastTotalSupply(blockNumber) * typeQuorum) / 10000;
    }
    
    /**
     * @dev Get voting period for a proposal (based on type)
     * @param proposalId ID of the proposal
     */
    function proposalDeadline(uint256 proposalId) 
        public 
        view 
        override 
        returns (uint256) 
    {
        ProposalMetadata memory metadata = proposalMetadata[proposalId];
        uint256 typePeriod = proposalTypeVotingPeriod[metadata.proposalType];
        
        if (typePeriod > 0) {
            return proposalSnapshot(proposalId) + typePeriod;
        }
        
        return super.proposalDeadline(proposalId);
    }
    
    /**
     * @dev Check if proposal succeeded (includes type-specific quorum)
     * @param proposalId ID of the proposal
     */
    function _quorumReached(uint256 proposalId) 
        internal 
        view 
        override(Governor, GovernorCountingSimple) 
        returns (bool) 
    {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
        uint256 totalVotes = againstVotes + forVotes + abstainVotes;
        uint256 requiredQuorum = proposalQuorum(proposalId, proposalSnapshot(proposalId));
        
        return totalVotes >= requiredQuorum;
    }
    
    // Required overrides for multiple inheritance
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}