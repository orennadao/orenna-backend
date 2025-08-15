// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RepaymentEscrow} from "../src/RepaymentEscrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 for testing
contract MockToken is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

contract RepaymentEscrowTest is Test {
    RepaymentEscrow repaymentEscrow;
    MockToken token;
    
    address admin = makeAddr("admin");
    address allocationEscrow = makeAddr("allocationEscrow");
    address funder = makeAddr("funder");
    address steward = makeAddr("steward");
    address treasury = makeAddr("treasury");

    uint256 projectId = 1;

    function setUp() public {
        vm.startPrank(admin);
        
        repaymentEscrow = new RepaymentEscrow();
        token = new MockToken();
        
        repaymentEscrow.grantRole(repaymentEscrow.PROJECT_ADMIN_ROLE(), admin);
        repaymentEscrow.grantRole(repaymentEscrow.ALLOCATION_ESCROW_ROLE(), allocationEscrow);
        
        // Configure a project for testing
        repaymentEscrow.configureRepayment(
            projectId,
            1000000, // forwardPrincipal
            1000000, // repaymentCap
            200,     // platformFeeBps (2%)
            50000,   // platformFeeCap
            funder,
            steward,
            treasury,
            token,
            RepaymentEscrow.RepaymentPolicy.FUNDER_FIRST_95_5
        );
        
        vm.stopPrank();
    }

    function test_BasicDeployment() public view {
        assertTrue(address(repaymentEscrow) != address(0));
        assertTrue(repaymentEscrow.hasRole(repaymentEscrow.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(repaymentEscrow.hasRole(repaymentEscrow.ALLOCATION_ESCROW_ROLE(), allocationEscrow));
    }

    function test_ProjectConfiguration() public view {
        RepaymentEscrow.RepaymentConfig memory config = repaymentEscrow.getRepaymentStatus(projectId);
        
        assertEq(config.forwardPrincipal, 1000000);
        assertEq(config.repaymentCap, 1000000);
        assertEq(config.platformFeeBps, 200);
        assertEq(config.funder, funder);
        assertTrue(config.configured);
    }

    function test_NotifyProceeds() public {
        uint256 amount = 100000;
        bytes32 considerationRef = keccak256("test-ref");

        // This should work now since the project is configured
        vm.prank(allocationEscrow);
        repaymentEscrow.notifyProceeds(projectId, amount, considerationRef);

        // Verify it was processed
        assertTrue(repaymentEscrow.isConsiderationProcessed(projectId, considerationRef));
    }

    function test_NotifyProceeds_UnauthorizedFails() public {
        uint256 amount = 100000;
        bytes32 considerationRef = keccak256("test-ref");

        // This should fail since random address doesn't have the role
        vm.expectRevert();
        vm.prank(makeAddr("random"));
        repaymentEscrow.notifyProceeds(projectId, amount, considerationRef);
    }

    function test_NotifyProceeds_UnconfiguredProjectFails() public {
        uint256 unconfiguredProjectId = 999;
        uint256 amount = 100000;
        bytes32 considerationRef = keccak256("test-ref");

        vm.expectRevert("not-configured");
        vm.prank(allocationEscrow);
        repaymentEscrow.notifyProceeds(unconfiguredProjectId, amount, considerationRef);
    }

    function test_DoubleProcessingFails() public {
        uint256 amount = 100000;
        bytes32 considerationRef = keccak256("test-ref");

        // First call should succeed
        vm.prank(allocationEscrow);
        repaymentEscrow.notifyProceeds(projectId, amount, considerationRef);

        // Second call with same considerationRef should fail
        vm.expectRevert("already-processed");
        vm.prank(allocationEscrow);
        repaymentEscrow.notifyProceeds(projectId, amount, considerationRef);
    }
}