// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MethodRegistry} from "../src/MethodRegistry.sol";
import {LiftTokens} from "../src/LiftTokens.sol";
import {RepaymentEscrow} from "../src/RepaymentEscrow.sol";

// Define the interface directly here for casting
interface IRepaymentEscrow {
    function notifyProceeds(uint256 projectId, uint256 amount, bytes32 considerationRef) external;
}

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0x1));
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy core contracts first
        MethodRegistry methodRegistry = new MethodRegistry();
        LiftTokens liftTokens = new LiftTokens("https://api.orenna.dao/lift-tokens/{id}", methodRegistry);
        RepaymentEscrow repaymentEscrow = new RepaymentEscrow();

        // For now, let's skip AllocationEscrow since it has interface issues
        // We'll focus on the working contracts first

        vm.stopBroadcast();

        console.log("Core Deployment Complete!");
        console.log("MethodRegistry:", address(methodRegistry));
        console.log("LiftTokens:", address(liftTokens));
        console.log("RepaymentEscrow:", address(repaymentEscrow));
        
        console.log("Next Steps:");
        console.log("1. Export ABIs to packages/abi/");
        console.log("2. Update backend environment variables");
        console.log("3. Add AllocationEscrow integration in PR2");
    }
}