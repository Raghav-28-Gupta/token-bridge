// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBridge {
     event Deposit(address indexed token, address indexed sender, address indexed recipient, uint256 amount, uint256 nonce, uint256 targetChainId);
     event Withdraw(address indexed token, address indexed recipient, uint256 amount, uint256 nonce, uint256 sourceChainId);

     event ValidatorAdded(address indexed validator);
     event ValidatorRemoved(address indexed validator);
     event MinValidatorsUpdated(uint256 minValidators);

     function deposit(address token, uint256 amount, address recipient, uint256 targetChainId) external payable;

     function withdraw(address token, address recipient, uint256 amount, uint256 nonce, uint256 sourceChainId, bytes[] calldata signatures) external;
}