// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Bridge.sol";
import "../src/BridgeToken.sol";

/**
 * @title Configure
 * @notice Post-deployment configuration scripts for the Bridge
 * @dev Run these scripts after initial deployment to configure the bridge
 */

/**
 * @notice Add validators to an existing bridge
 * Usage: forge script script/Configure.s.sol:AddValidators --rpc-url $RPC_URL --broadcast
 */
contract AddValidators is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        // Load new validators from environment
        address[] memory newValidators = new address[](
            vm.envUint("NUM_NEW_VALIDATORS")
        );
        for (uint256 i = 0; i < newValidators.length; i++) {
            newValidators[i] = vm.envAddress(
                string.concat("NEW_VALIDATOR_", vm.toString(i + 1))
            );
        }

        vm.startBroadcast(deployerPrivateKey);
        
        // creating a reference to an existing Bridge contract so we can call its functions
        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Adding Validators ===");
        for (uint256 i = 0; i < newValidators.length; i++) {
            if (!bridge.isValidator(newValidators[i])) {
                bridge.addValidator(newValidators[i]);
                console.log("Added validator:", newValidators[i]);
            } else {
                console.log("Validator already exists:", newValidators[i]);
            }
        }

        console.log("Total validators after addition:", newValidators.length);

        vm.stopBroadcast();
    }
}

/**
 * @notice Remove validators from an existing bridge
 * Usage: forge script script/Configure.s.sol:RemoveValidators --rpc-url $RPC_URL --broadcast
 */
contract RemoveValidators is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        // Load validators to remove from environment
        address[] memory validatorsToRemove = new address[](
            vm.envUint("NUM_REMOVE_VALIDATORS")
        );
        for (uint256 i = 0; i < validatorsToRemove.length; i++) {
            validatorsToRemove[i] = vm.envAddress(
                string.concat("REMOVE_VALIDATOR_", vm.toString(i + 1))
            );
        }

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Removing Validators ===");
        for (uint256 i = 0; i < validatorsToRemove.length; i++) {
            if (bridge.isValidator(validatorsToRemove[i])) {
                bridge.removeValidator(validatorsToRemove[i]);
                console.log("Removed validator:", validatorsToRemove[i]);
            } else {
                console.log("Validator does not exist:", validatorsToRemove[i]);
            }
        }

        vm.stopBroadcast();
    }
}

/**
 * @notice Update minimum validators threshold
 * Usage: forge script script/Configure.s.sol:UpdateMinValidators --rpc-url $RPC_URL --broadcast
 */
contract UpdateMinValidators is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");
        uint256 newMinValidators = vm.envUint("NEW_MIN_VALIDATORS");

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Updating Min Validators ===");
        console.log("Current min validators:", bridge.minValidators());
        console.log("New min validators:", newMinValidators);

        bridge.setMinValidators(newMinValidators);
        console.log("Min validators updated successfully");

        vm.stopBroadcast();
    }
}

/**
 * @notice Add supported tokens to the bridge
 * Usage: forge script script/Configure.s.sol:AddSupportedTokens --rpc-url $RPC_URL --broadcast
 */
contract AddSupportedTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        // Load tokens to add
        address[] memory tokensToAdd = new address[](vm.envUint("NUM_TOKENS"));
        for (uint256 i = 0; i < tokensToAdd.length; i++) {
            tokensToAdd[i] = vm.envAddress(
                string.concat("TOKEN_", vm.toString(i + 1))
            );
        }

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Adding Supported Tokens ===");
        for (uint256 i = 0; i < tokensToAdd.length; i++) {
            if (!bridge.supportedTokens(tokensToAdd[i])) {
                bridge.addSupportedToken(tokensToAdd[i]);
                console.log("Added token:", tokensToAdd[i]);
            } else {
                console.log("Token already supported:", tokensToAdd[i]);
            }
        }

        vm.stopBroadcast();
    }
}

/**
 * @notice Remove supported tokens from the bridge
 * Usage: forge script script/Configure.s.sol:RemoveSupportedTokens --rpc-url $RPC_URL --broadcast
 */
contract RemoveSupportedTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        // Load tokens to remove
        address[] memory tokensToRemove = new address[](
            vm.envUint("NUM_REMOVE_TOKENS")
        );
        for (uint256 i = 0; i < tokensToRemove.length; i++) {
            tokensToRemove[i] = vm.envAddress(
                string.concat("REMOVE_TOKEN_", vm.toString(i + 1))
            );
        }

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Removing Supported Tokens ===");
        for (uint256 i = 0; i < tokensToRemove.length; i++) {
            if (bridge.supportedTokens(tokensToRemove[i])) {
                bridge.removeSupportedToken(tokensToRemove[i]);
                console.log("Removed token:", tokensToRemove[i]);
            } else {
                console.log("Token not supported:", tokensToRemove[i]);
            }
        }

        vm.stopBroadcast();
    }
}

/**
 * @notice Pause the bridge (emergency)
 * Usage: forge script script/Configure.s.sol:PauseBridge --rpc-url $RPC_URL --broadcast
 */
contract PauseBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Pausing Bridge ===");
        console.log("Bridge address:", bridgeAddress);

        bridge.pause();
        console.log("Bridge paused successfully");

        vm.stopBroadcast();
    }
}

/**
 * @notice Unpause the bridge
 * Usage: forge script script/Configure.s.sol:UnpauseBridge --rpc-url $RPC_URL --broadcast
 */
contract UnpauseBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Unpausing Bridge ===");
        console.log("Bridge address:", bridgeAddress);

        bridge.unpause();
        console.log("Bridge unpaused successfully");

        vm.stopBroadcast();
    }
}

/**
 * @notice Emergency withdraw (only works when paused)
 * Usage: forge script script/Configure.s.sol:EmergencyWithdraw --rpc-url $RPC_URL --broadcast
 */
contract EmergencyWithdraw is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");
        address tokenAddress = vm.envAddress("EMERGENCY_TOKEN"); // address(0) for native token
        address recipient = vm.envAddress("EMERGENCY_RECIPIENT");
        uint256 amount = vm.envUint("EMERGENCY_AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Emergency Withdraw ===");
        console.log("Bridge address:", bridgeAddress);
        console.log("Token:", tokenAddress);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);

        require(
            bridge.paused(),
            "Bridge must be paused for emergency withdraw"
        );

        bridge.emergencyWithdraw(tokenAddress, recipient, amount);
        console.log("Emergency withdraw completed");

        vm.stopBroadcast();
    }
}

/**
 * @notice Update bridge address for a BridgeToken
 * Usage: forge script script/Configure.s.sol:UpdateTokenBridge --rpc-url $RPC_URL --broadcast
 */
contract UpdateTokenBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tokenAddress = vm.envAddress("BRIDGE_TOKEN_ADDRESS");
        address newBridgeAddress = vm.envAddress("NEW_BRIDGE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        BridgeToken token = BridgeToken(tokenAddress);

        console.log("\n=== Updating Token Bridge ===");
        console.log("Token:", tokenAddress);
        console.log("Old Bridge:", token.bridge());
        console.log("New Bridge:", newBridgeAddress);

        token.updateBridge(newBridgeAddress);
        console.log("Token bridge updated successfully");

        vm.stopBroadcast();
    }
}

/**
 * @notice Complete bridge configuration (for initial setup)
 * Usage: forge script script/Configure.s.sol:InitialConfiguration --rpc-url $RPC_URL --broadcast
 */
contract InitialConfiguration is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Initial Bridge Configuration ===");
        console.log("Bridge address:", bridgeAddress);

        // Add any wrapped tokens that were deployed
        address wrappedEth = vm.envOr("WRAPPED_ETH_ADDRESS", address(0));
        address wrappedUsdc = vm.envOr("WRAPPED_USDC_ADDRESS", address(0));
        address wrappedUsdt = vm.envOr("WRAPPED_USDT_ADDRESS", address(0));

        if (wrappedEth != address(0) && !bridge.supportedTokens(wrappedEth)) {
            bridge.addSupportedToken(wrappedEth);
            console.log("Added WETH:", wrappedEth);
        }

        if (wrappedUsdc != address(0) && !bridge.supportedTokens(wrappedUsdc)) {
            bridge.addSupportedToken(wrappedUsdc);
            console.log("Added USDC:", wrappedUsdc);
        }

        if (wrappedUsdt != address(0) && !bridge.supportedTokens(wrappedUsdt)) {
            bridge.addSupportedToken(wrappedUsdt);
            console.log("Added USDT:", wrappedUsdt);
        }

        // Verify configuration
        console.log("\n=== Configuration Summary ===");
        console.log("Chain ID:", bridge.currentChainId());
        console.log("Min Validators:", bridge.minValidators());
        console.log("Deposit Nonce:", bridge.depositNonce());
        console.log("Is Paused:", bridge.paused());

        vm.stopBroadcast();
    }
}

/**
 * @notice View bridge status
 * Usage: forge script script/Configure.s.sol:ViewBridgeStatus --rpc-url $RPC_URL
 */
contract ViewBridgeStatus is Script {
    function run() external view {
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");
        Bridge bridge = Bridge(payable(bridgeAddress));

        console.log("\n=== Bridge Status ===");
        console.log("Address:", bridgeAddress);
        console.log("Chain ID:", bridge.currentChainId());
        console.log("Min Validators:", bridge.minValidators());
        console.log("Deposit Nonce:", bridge.depositNonce());
        console.log("Is Paused:", bridge.paused());
        console.log("Owner:", bridge.owner());

        // Check if native token is supported
        console.log(
            "\nNative Token Supported:",
            bridge.supportedTokens(address(0))
        );
    }
}
