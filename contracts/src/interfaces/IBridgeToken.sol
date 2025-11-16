// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridgeToken {
    function mint(address to, uint256 amount) external;
    function burnFromBridge(address from, uint256 amount) external;
}