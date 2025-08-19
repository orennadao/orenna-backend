// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title OrennaGovernanceToken
 * @notice ERC-20 governance token for OrennaDAO with voting capabilities
 * @dev Extends OpenZeppelin's ERC20Votes for snapshot-based voting power
 */
contract OrennaGovernanceToken is ERC20, ERC20Permit, ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Integration with existing OrennaDAO contracts
    address public immutable methodRegistry;
    address public immutable liftTokens;
    
    // Total supply cap (1M tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    
    /**
     * @dev Constructor
     * @param _methodRegistry Address of the MethodRegistry contract
     * @param _liftTokens Address of the LiftTokens contract
     * @param _initialOwner Initial owner who receives DEFAULT_ADMIN_ROLE
     */
    constructor(
        address _methodRegistry,
        address _liftTokens,
        address _initialOwner
    ) 
        ERC20("Orenna Governance Token", "ORNA") 
        ERC20Permit("Orenna Governance Token")
    {
        require(_methodRegistry != address(0), "Invalid method registry");
        require(_liftTokens != address(0), "Invalid lift tokens");
        require(_initialOwner != address(0), "Invalid initial owner");
        
        methodRegistry = _methodRegistry;
        liftTokens = _liftTokens;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _grantRole(MINTER_ROLE, _initialOwner);
        _grantRole(BURNER_ROLE, _initialOwner);
        
        // Mint initial supply to owner (500k tokens)
        _mint(_initialOwner, 500_000 * 10**18);
        emit TokensMinted(_initialOwner, 500_000 * 10**18, "Initial mint");
    }
    
    /**
     * @dev Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (for transparency)
     */
    function mint(address to, uint256 amount, string calldata reason) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Burn tokens from an address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @param reason Reason for burning (for transparency)
     */
    function burn(address from, uint256 amount, string calldata reason) 
        external 
        onlyRole(BURNER_ROLE) 
    {
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }
    
    /**
     * @dev Self-burn tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, "Self-burn");
    }
    
    /**
     * @dev Get voting power at current block
     * @param account Address to check voting power for
     * @return Current voting power
     */
    function getVotingPower(address account) external view returns (uint256) {
        return getVotes(account);
    }
    
    /**
     * @dev Get voting power at specific block
     * @param account Address to check voting power for
     * @param blockNumber Block number to check at
     * @return Voting power at specified block
     */
    function getVotingPowerAt(address account, uint256 blockNumber) 
        external 
        view 
        returns (uint256) 
    {
        return getPastVotes(account, blockNumber);
    }
    
    /**
     * @dev Check if an address has voting power above threshold
     * @param account Address to check
     * @param threshold Minimum voting power required
     * @return Whether account meets threshold
     */
    function hasVotingPower(address account, uint256 threshold) 
        external 
        view 
        returns (bool) 
    {
        return getVotes(account) >= threshold;
    }
    
    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}