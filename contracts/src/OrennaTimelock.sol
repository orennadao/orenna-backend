// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OrennaTimelock
 * @notice Timelock controller for OrennaDAO governance with ecosystem-specific delays
 * @dev Extends OpenZeppelin TimelockController with custom delay management
 */
contract OrennaTimelock is TimelockController {
    // Custom roles for different delay types
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant DELAY_MANAGER_ROLE = keccak256("DELAY_MANAGER_ROLE");
    
    // Different delays for different types of operations
    mapping(bytes4 => uint256) public operationDelays;
    
    // Default delays (in seconds)
    uint256 public constant STANDARD_DELAY = 2 days;
    uint256 public constant ECOSYSTEM_DELAY = 3 days;
    uint256 public constant PROTOCOL_DELAY = 7 days;
    uint256 public constant EMERGENCY_DELAY = 6 hours;
    
    // Integration with existing OrennaDAO contracts
    address public immutable methodRegistry;
    address public immutable liftTokens;
    address public immutable financeContract;
    
    // Events
    event OperationDelayUpdated(bytes4 indexed selector, uint256 newDelay);
    event EmergencyOperationExecuted(bytes32 indexed id, address executor);
    
    /**
     * @dev Constructor
     * @param minDelay Minimum delay for standard operations
     * @param proposers Array of addresses that can propose operations
     * @param executors Array of addresses that can execute operations
     * @param _methodRegistry Method registry contract address
     * @param _liftTokens Lift tokens contract address  
     * @param _financeContract Finance contract address
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address _methodRegistry,
        address _liftTokens,
        address _financeContract
    ) TimelockController(minDelay, proposers, executors, msg.sender) {
        require(_methodRegistry != address(0), "Invalid method registry");
        require(_liftTokens != address(0), "Invalid lift tokens");
        require(_financeContract != address(0), "Invalid finance contract");
        
        methodRegistry = _methodRegistry;
        liftTokens = _liftTokens;
        financeContract = _financeContract;
        
        // Grant additional roles
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(DELAY_MANAGER_ROLE, msg.sender);
        
        // Set up operation-specific delays
        _initializeOperationDelays();
    }
    
    /**
     * @dev Initialize operation-specific delays
     */
    function _initializeOperationDelays() internal {
        // Method Registry operations (ecosystem parameters)
        operationDelays[bytes4(keccak256("registerMethod(bytes32,bytes32,string,uint64,uint64)"))] = ECOSYSTEM_DELAY;
        operationDelays[bytes4(keccak256("deactivateMethod(bytes32)"))] = ECOSYSTEM_DELAY;
        operationDelays[bytes4(keccak256("updateVerificationCriteria(bytes32,uint256,uint256)"))] = ECOSYSTEM_DELAY;
        
        // Lift Token operations
        operationDelays[bytes4(keccak256("createToken(uint256,uint256,string)"))] = STANDARD_DELAY;
        operationDelays[bytes4(keccak256("mint(address,uint256,uint256,bytes)"))] = STANDARD_DELAY;
        
        // Finance operations
        operationDelays[bytes4(keccak256("updateApprovalThreshold(uint256)"))] = STANDARD_DELAY;
        operationDelays[bytes4(keccak256("updatePlatformFee(uint256)"))] = STANDARD_DELAY;
        
        // Protocol upgrades (longer delay)
        operationDelays[bytes4(keccak256("upgrade(address)"))] = PROTOCOL_DELAY;
        operationDelays[bytes4(keccak256("upgradeToAndCall(address,bytes)"))] = PROTOCOL_DELAY;
    }
    
    /**
     * @dev Update delay for a specific operation
     * @param selector Function selector to update delay for
     * @param newDelay New delay in seconds
     */
    function updateOperationDelay(bytes4 selector, uint256 newDelay) 
        external 
        onlyRole(DELAY_MANAGER_ROLE) 
    {
        require(newDelay >= 1 hours, "Delay too short");
        require(newDelay <= 30 days, "Delay too long");
        
        operationDelays[selector] = newDelay;
        emit OperationDelayUpdated(selector, newDelay);
    }
    
    /**
     * @dev Schedule operation with custom delay based on function selector
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Encoded function call
     * @param predecessor Operation that must be executed first
     * @param salt Random salt for operation ID
     */
    function scheduleWithCustomDelay(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) {
        // Extract function selector from data
        bytes4 selector = bytes4(data[:4]);
        
        // Get custom delay for this operation
        uint256 customDelay = operationDelays[selector];
        uint256 delay = customDelay > 0 ? customDelay : getMinDelay();
        
        schedule(target, value, data, predecessor, salt, delay);
    }
    
    /**
     * @dev Schedule batch operation with custom delay
     * @param targets Array of target contract addresses
     * @param values Array of ETH values to send
     * @param payloads Array of encoded function calls
     * @param predecessor Operation that must be executed first
     * @param salt Random salt for operation ID
     */
    function scheduleBatchWithCustomDelay(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) {
        require(targets.length == payloads.length, "Length mismatch");
        
        // Find the maximum delay among all operations
        uint256 maxDelay = getMinDelay();
        
        for (uint256 i = 0; i < payloads.length; i++) {
            if (payloads[i].length >= 4) {
                bytes4 selector = bytes4(payloads[i][:4]);
                uint256 customDelay = operationDelays[selector];
                if (customDelay > maxDelay) {
                    maxDelay = customDelay;
                }
            }
        }
        
        scheduleBatch(targets, values, payloads, predecessor, salt, maxDelay);
    }
    
    /**
     * @dev Emergency execution with shorter delay
     * @param target Target contract address
     * @param value ETH value to send
     * @param payload Encoded function call
     * @param predecessor Operation that must be executed first
     * @param salt Random salt for operation ID
     */
    function emergencyExecute(
        address target,
        uint256 value,
        bytes calldata payload,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(EMERGENCY_ROLE) {
        bytes32 id = hashOperation(target, value, payload, predecessor, salt);
        
        require(!isOperationDone(id), "Operation already executed");
        
        // For emergency operations, schedule with minimal delay
        if (!isOperationPending(id)) {
            schedule(target, value, payload, predecessor, salt, EMERGENCY_DELAY);
        }
        
        // Wait for emergency delay to pass
        require(isOperationReady(id), "Emergency delay not met");
        
        execute(target, value, payload, predecessor, salt);
        emit EmergencyOperationExecuted(id, msg.sender);
    }
    
    /**
     * @dev Get the effective delay for a specific operation
     * @param data Encoded function call
     * @return Effective delay in seconds
     */
    function getOperationDelay(bytes calldata data) external view returns (uint256) {
        if (data.length < 4) {
            return getMinDelay();
        }
        
        bytes4 selector = bytes4(data[:4]);
        uint256 customDelay = operationDelays[selector];
        
        return customDelay > 0 ? customDelay : getMinDelay();
    }
    
    /**
     * @dev Check if an operation is an ecosystem-related operation
     * @param target Target contract address
     * @return Whether the operation affects ecosystem parameters
     */
    function isEcosystemOperation(address target) external view returns (bool) {
        return target == methodRegistry || target == liftTokens;
    }
    
    /**
     * @dev Check if an operation is a finance-related operation
     * @param target Target contract address
     * @return Whether the operation affects finance parameters
     */
    function isFinanceOperation(address target) external view returns (bool) {
        return target == financeContract;
    }
    
    /**
     * @dev Get all configured operation delays
     * @return selectors Array of function selectors
     * @return delays Array of corresponding delays
     */
    function getAllOperationDelays() 
        external 
        view 
        returns (bytes4[] memory selectors, uint256[] memory delays) 
    {
        // This would need to be implemented with a storage pattern
        // that tracks all configured selectors, simplified for this example
        selectors = new bytes4[](0);
        delays = new uint256[](0);
    }
}