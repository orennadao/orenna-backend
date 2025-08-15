// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RepaymentEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PROJECT_ADMIN_ROLE = keccak256("PROJECT_ADMIN_ROLE");
    bytes32 public constant ALLOCATION_ESCROW_ROLE = keccak256("ALLOCATION_ESCROW_ROLE");

    enum RepaymentPolicy { FUNDER_FIRST_95_5, AFTER_REPAYMENT, TAPERED }

    struct RepaymentConfig {
        uint256 forwardPrincipal;
        uint256 repaymentCap;
        uint256 platformFeeBps;
        uint256 platformFeeCap;
        address funder;
        address stewardOrPool;
        address platformTreasury;
        IERC20 paymentToken;
        RepaymentPolicy policy;
        uint256 paidToFunder;
        uint256 platformFeesPaid;
        bool configured;
    }

    event ProceedsReceived(uint256 indexed projectId, uint256 amount, bytes32 considerationRef);
    event PaidFunder(uint256 indexed projectId, uint256 amount);
    event PaidPlatform(uint256 indexed projectId, uint256 amount);
    event PaidSteward(uint256 indexed projectId, uint256 amount);

    mapping(uint256 => RepaymentConfig) public repaymentConfigs;
    mapping(uint256 => mapping(bytes32 => bool)) public processedConsiderations;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function notifyProceeds(
        uint256 projectId,
        uint256 amount,
        bytes32 considerationRef
    ) external onlyRole(ALLOCATION_ESCROW_ROLE) nonReentrant {
        require(amount > 0, "invalid-amount");
        require(!processedConsiderations[projectId][considerationRef], "already-processed");
        
        RepaymentConfig storage config = repaymentConfigs[projectId];
        require(config.configured, "not-configured");

        processedConsiderations[projectId][considerationRef] = true;
        
        emit ProceedsReceived(projectId, amount, considerationRef);
    }

    function configureRepayment(
        uint256 projectId,
        uint256 forwardPrincipal,
        uint256 repaymentCap,
        uint256 platformFeeBps,
        uint256 platformFeeCap,
        address funder,
        address stewardOrPool,
        address platformTreasury,
        IERC20 paymentToken,
        RepaymentPolicy policy
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        require(!repaymentConfigs[projectId].configured, "already-configured");
        require(forwardPrincipal > 0, "invalid-principal");

        repaymentConfigs[projectId] = RepaymentConfig({
            forwardPrincipal: forwardPrincipal,
            repaymentCap: repaymentCap,
            platformFeeBps: platformFeeBps,
            platformFeeCap: platformFeeCap,
            funder: funder,
            stewardOrPool: stewardOrPool,
            platformTreasury: platformTreasury,
            paymentToken: paymentToken,
            policy: policy,
            paidToFunder: 0,
            platformFeesPaid: 0,
            configured: true
        });
    }

    function getRepaymentStatus(uint256 projectId) external view returns (RepaymentConfig memory) {
        return repaymentConfigs[projectId];
    }

    function isConsiderationProcessed(
        uint256 projectId,
        bytes32 considerationRef
    ) external view returns (bool) {
        return processedConsiderations[projectId][considerationRef];
    }
}