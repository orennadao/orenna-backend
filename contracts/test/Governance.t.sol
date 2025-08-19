// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/OrennaGovernanceToken.sol";
import "../src/OrennaGovernor.sol";
import "../src/OrennaTimelock.sol";
import "../src/MethodRegistry.sol";
import "../src/LiftTokens.sol";
import "../src/ProjectNFT.sol";
import "../src/interfaces/IProjectNFT.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract GovernanceTest is Test {
    OrennaGovernanceToken public token;
    OrennaGovernor public governor;
    OrennaTimelock public timelock;
    MethodRegistry public methodRegistry;
    LiftTokens public liftTokens;
    ProjectNFT public projectNFT;
    
    address public owner = address(0x1);
    address public proposer = address(0x2);
    address public voter1 = address(0x3);
    address public voter2 = address(0x4);
    address public voter3 = address(0x5);
    
    uint256 public constant PROPOSAL_THRESHOLD = 100e18; // 100 ORNA
    uint256 public constant VOTING_PERIOD = 50400; // 1 week in blocks
    uint256 public constant VOTING_DELAY = 7200; // 1 day in blocks
    
    function setUp() public {
        // Deploy supporting contracts
        vm.startPrank(owner);
        
        methodRegistry = new MethodRegistry();
        projectNFT = new ProjectNFT();
        projectNFT.initialize(owner);
        liftTokens = new LiftTokens("https://api.orenna.io/lift-tokens/{id}", methodRegistry, IProjectNFT(address(projectNFT)));
        
        // Deploy governance token
        token = new OrennaGovernanceToken(
            address(methodRegistry),
            address(liftTokens),
            owner
        );
        
        // Set up timelock with initial parameters
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = owner; // Will be updated to governor later
        executors[0] = owner; // Will be updated to governor later
        
        timelock = new OrennaTimelock(
            2 days, // min delay
            proposers,
            executors,
            address(methodRegistry),
            address(liftTokens),
            address(0x999) // dummy finance contract
        );
        
        // Deploy governor
        governor = new OrennaGovernor(
            IVotes(address(token)),
            timelock,
            address(methodRegistry),
            address(liftTokens),
            address(0x999) // dummy finance contract
        );
        
        // Grant timelock roles to governor
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));
        
        // Grant necessary roles for governance actions
        token.grantRole(token.MINTER_ROLE(), address(timelock));
        
        // Revoke admin role from owner for timelock
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), owner);
        
        vm.stopPrank();
        
        // Distribute tokens for testing (need enough for 4% quorum = 20,000 tokens)
        vm.startPrank(owner);
        token.transfer(proposer, 150e18); // Enough to create proposals
        token.transfer(voter1, 15000e18); // Large holder for quorum
        token.transfer(voter2, 10000e18); // Medium holder
        token.transfer(voter3, 5000e18); // Smaller holder but still significant
        vm.stopPrank();
        
        // Delegate voting power
        vm.prank(proposer);
        token.delegate(proposer);
        
        vm.prank(voter1);
        token.delegate(voter1);
        
        vm.prank(voter2);
        token.delegate(voter2);
        
        vm.prank(voter3);
        token.delegate(voter3);
        
        // Advance block for delegation to take effect
        vm.roll(block.number + 1);
    }
    
    function testTokenDeployment() public {
        assertEq(token.name(), "Orenna Governance Token");
        assertEq(token.symbol(), "ORNA");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 500_000e18);
        assertEq(token.MAX_SUPPLY(), 1_000_000e18);
    }
    
    function testGovernorDeployment() public {
        assertEq(governor.name(), "OrennaGovernor");
        assertEq(governor.votingDelay(), VOTING_DELAY);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
        assertEq(governor.quorum(block.number - 1), 20_000e18); // 4% of total supply
    }
    
    function testTokenDelegation() public {
        assertEq(token.getVotes(proposer), 150e18);
        assertEq(token.getVotes(voter1), 15000e18);
        assertEq(token.getVotes(voter2), 10000e18);
        assertEq(token.getVotes(voter3), 5000e18);
    }
    
    function testCreateStandardProposal() public {
        // Prepare proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            token.mint.selector,
            voter1,
            1000e18,
            "Governance mint"
        );
        
        string memory description = "Mint 1000 ORNA tokens to voter1";
        
        vm.prank(proposer);
        uint256 proposalId = governor.proposeWithMetadata(
            targets,
            values,
            calldatas,
            description,
            OrennaGovernor.ProposalType.Standard,
            bytes32(0),
            bytes32(0),
            bytes32(0),
            bytes32(0)
        );
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));
        
        // Check proposal metadata
        (
            OrennaGovernor.ProposalType proposalType,
            bytes32 ecosystemParameters,
            bytes32 methodData,
            bytes32 financeData,
            bytes32 liftTokenData,
            bool isEmergency
        ) = governor.proposalMetadata(proposalId);
        
        assertEq(uint256(proposalType), uint256(OrennaGovernor.ProposalType.Standard));
        assertEq(ecosystemParameters, bytes32(0));
        assertEq(methodData, bytes32(0));
        assertEq(financeData, bytes32(0));
        assertEq(liftTokenData, bytes32(0));
        assertFalse(isEmergency);
    }
    
    function testEcosystemParameterProposal() public {
        // Prepare ecosystem parameter proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(methodRegistry);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            MethodRegistry.updateVerificationCriteria.selector,
            keccak256("test-method"),
            8500, // 85% confidence requirement
            86400 // 24 hours validation period
        );
        
        string memory description = "Update minimum confidence for test method to 85%";
        bytes32 ecosystemHash = keccak256("ecosystem-parameter-change");
        
        vm.prank(proposer);
        uint256 proposalId = governor.proposeWithMetadata(
            targets,
            values,
            calldatas,
            description,
            OrennaGovernor.ProposalType.EcosystemParameter,
            ecosystemHash,
            bytes32(0),
            bytes32(0),
            bytes32(0)
        );
        
        // Check that ecosystem parameter was recorded
        (
            OrennaGovernor.ProposalType proposalType,
            bytes32 ecosystemParameters,
            ,,,
        ) = governor.proposalMetadata(proposalId);
        
        assertEq(uint256(proposalType), uint256(OrennaGovernor.ProposalType.EcosystemParameter));
        assertEq(ecosystemParameters, ecosystemHash);
    }
    
    function testVotingProcess() public {
        // Create proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            token.mint.selector,
            voter1,
            1000e18,
            "Test mint"
        );
        
        vm.prank(proposer);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Test proposal");
        
        // Fast forward to voting period
        vm.roll(block.number + VOTING_DELAY + 1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));
        
        // Cast votes
        vm.prank(voter1);
        governor.castVote(proposalId, 1); // For
        
        vm.prank(voter2);
        governor.castVote(proposalId, 1); // For
        
        vm.prank(voter3);
        governor.castVote(proposalId, 0); // Against
        
        // Check vote counts
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 25000e18); // voter1 + voter2 (15000 + 10000)
        assertEq(againstVotes, 5000e18); // voter3
        assertEq(abstainVotes, 0);
        
        // Fast forward to end of voting period
        vm.roll(block.number + VOTING_PERIOD + 1);
        
        // Check if proposal succeeded (forVotes > againstVotes and quorum reached)
        uint256 expectedState = forVotes > againstVotes ? 
            uint256(IGovernor.ProposalState.Succeeded) : 
            uint256(IGovernor.ProposalState.Defeated);
        assertEq(uint256(governor.state(proposalId)), expectedState);
    }
    
    function testQuorumRequirements() public {
        // Create proposal with insufficient voting
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            bytes4(keccak256("burn(uint256)")), 
            1e18
        );
        
        vm.prank(proposer);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Test proposal");
        
        // Fast forward to voting period
        vm.roll(block.number + VOTING_DELAY + 1);
        
        // Create a new voter with insufficient tokens for this specific test
        address lowVoter = address(0x99);
        vm.startPrank(owner);
        token.transfer(lowVoter, 50e18); // Very small amount
        vm.stopPrank();
        
        vm.prank(lowVoter);
        token.delegate(lowVoter);
        vm.roll(block.number + 1);
        
        // Only lowVoter votes (50 ORNA), which is less than 4% quorum (20,000 ORNA)
        vm.prank(lowVoter);
        governor.castVote(proposalId, 1); // For
        
        // Fast forward to end of voting period
        vm.roll(block.number + VOTING_PERIOD + 1);
        
        // Should be defeated due to insufficient quorum
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Defeated));
    }
    
    function testTimelockIntegration() public {
        // Create and pass proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            token.mint.selector,
            voter1,
            1000e18,
            "Governance mint"
        );
        
        string memory description = "Mint 1000 ORNA tokens";
        
        vm.prank(proposer);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        // Fast forward and vote
        vm.roll(block.number + VOTING_DELAY + 1);
        
        vm.prank(voter1);
        governor.castVote(proposalId, 1);
        
        vm.prank(voter2);
        governor.castVote(proposalId, 1);
        
        // Fast forward to end voting
        vm.roll(block.number + VOTING_PERIOD + 1);
        
        // Check if proposal succeeded
        uint256 currentState = uint256(governor.state(proposalId));
        assertEq(currentState, uint256(IGovernor.ProposalState.Succeeded));
        
        // Queue proposal
        bytes32 descriptionHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descriptionHash);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Queued));
        
        // Fast forward timelock delay
        vm.warp(block.timestamp + 2 days + 1);
        
        // Execute proposal
        uint256 balanceBefore = token.balanceOf(voter1);
        governor.execute(targets, values, calldatas, descriptionHash);
        uint256 balanceAfter = token.balanceOf(voter1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Executed));
        assertEq(balanceAfter - balanceBefore, 1000e18);
    }
    
    function testProposalThresholdEnforcement() public {
        // Try to create proposal with insufficient tokens
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            bytes4(keccak256("burn(uint256)")), 
            1e18
        );
        
        // Create a user with insufficient tokens for proposals
        address lowProposer = address(0x98);
        vm.startPrank(owner);
        token.transfer(lowProposer, 50e18); // Less than 100 ORNA threshold
        vm.stopPrank();
        
        vm.prank(lowProposer);
        token.delegate(lowProposer);
        vm.roll(block.number + 1);
        
        // lowProposer only has 50 ORNA, less than 100 ORNA threshold
        vm.prank(lowProposer);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("GovernorInsufficientProposerVotes(address,uint256,uint256)")),
                lowProposer,
                50e18,
                100e18
            )
        );
        governor.propose(targets, values, calldatas, "Should fail");
    }
    
    function testEmergencyProposal() public {
        // Grant emergency role to owner and ensure voting power
        vm.startPrank(owner);
        governor.grantRole(governor.EMERGENCY_ROLE(), owner);
        token.delegate(owner); // Owner needs to self-delegate to have voting power
        vm.roll(block.number + 1); // Advance block for delegation to take effect
        
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(
            token.mint.selector,
            owner,
            1000e18,
            "Emergency mint"
        );
        
        uint256 proposalId = governor.proposeEmergency(
            targets,
            values,
            calldatas,
            "Emergency proposal"
        );
        vm.stopPrank();
        
        // Check that it's marked as emergency
        (,,,,, bool isEmergency) = governor.proposalMetadata(proposalId);
        assertTrue(isEmergency);
        
        // Emergency proposals should have shorter voting period
        uint256 deadline = governor.proposalDeadline(proposalId);
        uint256 snapshot = governor.proposalSnapshot(proposalId);
        assertEq(deadline - snapshot, 14400); // 2 days for emergency
    }
}