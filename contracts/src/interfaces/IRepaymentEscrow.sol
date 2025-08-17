// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRepaymentEscrow
 * @notice Interface for the repayment escrow contract
 */
interface IRepaymentEscrow {
    enum RepaymentPolicy { FUNDER_FIRST_95_5, AFTER_REPAYMENT, TAPERED }

    struct RepaymentConfig {
        uint256 forwardPrincipal;      // Original forward amount
        uint256 repaymentCap;          // Max repayment to funder
        uint256 platformFeeBps;        // Platform fee in basis points
        uint256 platformFeeCap;        // Max platform fee in absolute terms
        address funder;                // Funder address
        address stewardOrPool;         // Steward/reinvestment pool address
        address platformTreasury;      // Platform treasury address
        address paymentToken;          // Payment token address
        RepaymentPolicy policy;        // Repayment waterfall policy
        uint256 paidToFunder;          // Total paid to funder so far
        uint256 platformFeesPaid;      // Total platform fees paid so far
        bool configured;               // Whether config is set
    }

    function notifyProceeds(uint256 projectId, uint256 amount, bytes32 considerationRef) external;
    function getRepaymentStatus(uint256 projectId) external view returns (RepaymentConfig memory config, uint256 repaymentProgress, uint256 feeProgress);
    function isConsiderationProcessed(uint256 projectId, bytes32 considerationRef) external view returns (bool);
}
