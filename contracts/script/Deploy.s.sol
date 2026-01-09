// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Bridge.sol";
import "../src/BridgeToken.sol";

contract DeployBridge is Script {
     function run() external {
          uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
          uint256 chainId = block.chainid;

          address[] memory validators = new address[](3);
          validators[0] = vm.envAddress("VALIDATOR_1");
          validators[1] = vm.envAddress("VALIDATOR_2");
          validators[2] = vm.envAddress("VALIDATOR_3");

          uint256 minValidators = vm.envUint("MIN_VALIDATORS");

          vm.startBroadcast(deployerPrivateKey);

          // Deploy Bridge
          Bridge bridge = new Bridge(validators, minValidators, chainId);

          console.log("Bridge deployed at:", address(bridge));
          console.log("Chain ID:", chainId);
          console.log("Min Validators:", minValidators);
          console.log("Validators:");
          for (uint256 i = 0; i < validators.length; i++) {
               console.log("  -", validators[i]);
          }

          vm.stopBroadcast();
     }
}

contract DeployBridgeToken is Script {
     function run() external {
          uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
          address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

          string memory name = vm.envString("TOKEN_NAME");
          string memory symbol = vm.envString("TOKEN_SYMBOL");
          uint8 decimals = uint8(vm.envUint("TOKEN_DECIMALS"));

          vm.startBroadcast(deployerPrivateKey);
          
          // Deploys individual BridgeToken contracts
          BridgeToken token = new BridgeToken(name, symbol, decimals, bridgeAddress);

          console.log("BridgeToken deployed at:", address(token));
          console.log("Name:", name);
          console.log("Symbol:", symbol);
          console.log("Decimals:", decimals);
          console.log("Bridge:", bridgeAddress);

          vm.stopBroadcast();
     }
}

contract ConfigureBridge is Script {
     function run() external {
          uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
          address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");

          vm.startBroadcast(deployerPrivateKey);

          Bridge bridge = Bridge(payable(bridgeAddress));

          // Add supported tokens
          address[] memory tokens = new address[](2);
          tokens[0] = vm.envAddress("TOKEN_1");
          tokens[1] = vm.envAddress("TOKEN_2");

          for (uint256 i = 0; i < tokens.length; i++) {
               if (!bridge.supportedTokens(tokens[i])) {
                    bridge.addSupportedToken(tokens[i]);
                    console.log("Added supported token:", tokens[i]);
               }
          }

          console.log("Bridge configuration complete");

          vm.stopBroadcast();
     }
}

// Full deployment script for new chain
contract FullDeploy is Script {
     struct DeploymentResult {
          address bridge;
          address[] bridgeTokens;
          string[] tokenSymbols;
     }

     function run() external returns (DeploymentResult memory) {
          uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
          uint256 chainId = block.chainid;

          // Setup validators
          address[] memory validators = new address[](3);
          validators[0] = vm.envAddress("VALIDATOR_1");
          validators[1] = vm.envAddress("VALIDATOR_2");
          validators[2] = vm.envAddress("VALIDATOR_3");

          uint256 minValidators = 2; // Require 2 out of 3 validators

          vm.startBroadcast(deployerPrivateKey);

          // 1. Deploy Bridge
          Bridge bridge = new Bridge(validators, minValidators, chainId);
          console.log("\n=== Bridge Deployed ===");
          console.log("Address:", address(bridge));
          console.log("Chain ID:", chainId);

          // 2. Deploy wrapped tokens for common tokens
          string[] memory tokenNames = new string[](3);
          string[] memory tokenSymbols = new string[](3);
          uint8[] memory tokenDecimals = new uint8[](3);

          tokenNames[0] = "Wrapped ETH";
          tokenSymbols[0] = "WETH";
          tokenDecimals[0] = 18;

          tokenNames[1] = "Wrapped USDC";
          tokenSymbols[1] = "USDC";
          tokenDecimals[1] = 6;

          tokenNames[2] = "Wrapped USDT";
          tokenSymbols[2] = "USDT";
          tokenDecimals[2] = 6;

          address[] memory bridgeTokens = new address[](tokenNames.length);

          console.log("\n=== Bridge Tokens Deployed ===");
          for (uint256 i = 0; i < tokenNames.length; i++) {
               // Deploys individual BridgeToken contracts
               BridgeToken token = new BridgeToken(
                    tokenNames[i],
                    tokenSymbols[i],
                    tokenDecimals[i],
                    address(bridge)
               );
               bridgeTokens[i] = address(token);

               // Add token to bridge's supported tokens
               bridge.addSupportedToken(address(token));

               console.log(tokenSymbols[i], ":", address(token));
          }

          console.log("\n=== Deployment Summary ===");
          console.log("Bridge:", address(bridge));
          console.log("Chain ID:", chainId);
          console.log("Min Validators:", minValidators);
          console.log("Total Tokens:", bridgeTokens.length);

          vm.stopBroadcast();

          return DeploymentResult({
                    bridge: address(bridge),
                    bridgeTokens: bridgeTokens,
                    tokenSymbols: tokenSymbols
               });
     }
}
