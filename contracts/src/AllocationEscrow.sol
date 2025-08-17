// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// Use a simple interface to avoid circular import issues
interface IRepaymentEscrow {
    function notifyProceeds(uint256 projectId, uint256 amount, bytes32 considerationRef) external;
}

contract AllocationEscrow is EIP712, AccessControl, ReentrancyGuard {
    bytes32 public constant PROJECT_ADMIN_ROLE = keccak256("PROJECT_ADMIN_ROLE");
    bytes32 public constant SALES_AGENT_ROLE = keccak256("SALES_AGENT_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    bytes32 public constant EXTENSION_TYPEHASH = keccak256(
        "Extension(uint256 projectId,bytes32 snapshotRoot,uint256 reservedUnits,uint256 newClosesAt,uint256 nonce)"
    );

    struct Extension {
        uint256 projectId;
        bytes32 snapshotRoot;
        uint256 reservedUnits;
        uint256 newClosesAt;
        uint256 nonce;
    }

    struct MarketAllocationWindow {
        uint64 opensAt;
        uint64 closesAt;
        uint64 maxTotalDuration;
        bool extendedOnce;
        bool closed;
        bytes32 snapshotRoot;
        uint256 reservedUnits;
    }

    struct ExpiryConfig {
        address funderUnitWallet;
        ExpiryPolicy onExpiryPolicy;
    }

    enum ExpiryPolicy { ASSIGN, AUTO_RETIRE }

    event MarketWindowOpened(uint256 indexed projectId, uint64 closesAt);
    event MarketWindowExtended(
        uint256 indexed projectId, 
        uint64 newClosesAt, 
        bytes32 snapshotRoot, 
        uint256 reservedUnits
    );
    event UnitsSold(
        uint256 indexed projectId, 
        address indexed beneficiary, 
        uint256[] tokenIds, 
        uint256[] amounts, 
        bytes32 considerationRef, 
        uint256 proceeds
    );
    event AssignedToFunder(uint256 indexed projectId, uint256[] tokenIds, uint256[] amounts);

    IERC1155 public immutable liftUnits;
    IRepaymentEscrow public immutable repaymentEscrow;
    
    mapping(uint256 => MarketAllocationWindow) public marketWindows;
    mapping(uint256 => ExpiryConfig) public expiryConfigs;
    mapping(uint256 => uint256) public nonces;

    constructor(IERC1155 _liftUnits, IRepaymentEscrow _repaymentEscrow) EIP712("LiftForward", "1") {
        liftUnits = _liftUnits;
        repaymentEscrow = _repaymentEscrow;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function openMarketWindow(
        uint256 projectId,
        uint64 duration,
        uint64 maxTotalDuration,
        address funderUnitWallet,
        ExpiryPolicy onExpiryPolicy
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        require(marketWindows[projectId].opensAt == 0, "window-exists");
        require(duration > 0 && duration <= maxTotalDuration, "invalid-duration");
        require(funderUnitWallet != address(0), "invalid-funder-wallet");

        uint64 closesAt = uint64(block.timestamp) + duration;
        
        marketWindows[projectId] = MarketAllocationWindow({
            opensAt: uint64(block.timestamp),
            closesAt: closesAt,
            maxTotalDuration: maxTotalDuration,
            extendedOnce: false,
            closed: false,
            snapshotRoot: bytes32(0),
            reservedUnits: 0
        });

        expiryConfigs[projectId] = ExpiryConfig({
            funderUnitWallet: funderUnitWallet,
            onExpiryPolicy: onExpiryPolicy
        });

        emit MarketWindowOpened(projectId, closesAt);
    }

    function extendMarketWindow(
        Extension calldata ext, 
        bytes calldata auditorSig
    ) external onlyRole(PROJECT_ADMIN_ROLE) {
        MarketAllocationWindow storage window = marketWindows[ext.projectId];
        require(window.opensAt > 0, "window-not-exists");
        require(!window.extendedOnce, "already-extended");
        require(!window.closed, "window-closed");
        require(ext.newClosesAt > window.closesAt, "invalid-extension");
        require(ext.newClosesAt > block.timestamp, "extension-past");
        
        uint64 totalDuration = uint64(ext.newClosesAt) - window.opensAt;
        require(totalDuration <= window.maxTotalDuration, "exceeds-max-duration");

        bytes32 structHash = keccak256(abi.encode(
            EXTENSION_TYPEHASH,
            ext.projectId,
            ext.snapshotRoot,
            ext.reservedUnits,
            ext.newClosesAt,
            nonces[ext.projectId]
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, auditorSig);
        require(hasRole(AUDITOR_ROLE, signer), "invalid-auditor");

        nonces[ext.projectId] += 1;
        window.closesAt = uint64(ext.newClosesAt);
        window.extendedOnce = true;
        window.snapshotRoot = ext.snapshotRoot;
        window.reservedUnits = ext.reservedUnits;

        emit MarketWindowExtended(
            ext.projectId, 
            uint64(ext.newClosesAt), 
            ext.snapshotRoot, 
            ext.reservedUnits
        );
    }

    function sellToBeneficiary(
        uint256 projectId,
        address beneficiary,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes32 considerationRef,
        uint256 proceeds
    ) external onlyRole(SALES_AGENT_ROLE) nonReentrant {
        MarketAllocationWindow storage window = marketWindows[projectId];
        require(window.opensAt > 0, "window-not-exists");
        require(!window.closed, "window-closed");
        require(block.timestamp <= window.closesAt, "window-expired");
        require(tokenIds.length == amounts.length, "length-mismatch");
        require(tokenIds.length > 0, "empty-sale");
        require(beneficiary != address(0), "invalid-beneficiary");

        liftUnits.safeBatchTransferFrom(address(this), beneficiary, tokenIds, amounts, "");

        if (proceeds > 0) {
            repaymentEscrow.notifyProceeds(projectId, proceeds, considerationRef);
        }

        emit UnitsSold(projectId, beneficiary, tokenIds, amounts, considerationRef, proceeds);
    }

    function assignToFunder(uint256 projectId) external {
        MarketAllocationWindow storage window = marketWindows[projectId];
        require(window.opensAt > 0, "window-not-exists");
        require(block.timestamp > window.closesAt, "window-active");
        require(!window.closed, "already-closed");

        ExpiryConfig storage config = expiryConfigs[projectId];
        
        uint256[] memory tokenIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        
        tokenIds[0] = projectId * 1000;
        amounts[0] = liftUnits.balanceOf(address(this), tokenIds[0]);

        if (amounts[0] > 0) {
            liftUnits.safeTransferFrom(
                address(this), 
                config.funderUnitWallet, 
                tokenIds[0], 
                amounts[0], 
                ""
            );
            emit AssignedToFunder(projectId, tokenIds, amounts);
        }

        window.closed = true;
    }

    function isWindowActive(uint256 projectId) external view returns (bool) {
        MarketAllocationWindow storage window = marketWindows[projectId];
        return window.opensAt > 0 && !window.closed && block.timestamp <= window.closesAt;
    }

    function getMarketWindow(uint256 projectId) external view returns (MarketAllocationWindow memory) {
        return marketWindows[projectId];
    }

    function onERC1155Received(
        address, 
        address, 
        uint256, 
        uint256, 
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address, 
        address, 
        uint256[] calldata, 
        uint256[] calldata, 
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}