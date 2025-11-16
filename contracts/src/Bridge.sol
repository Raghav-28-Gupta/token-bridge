// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IBridge.sol";
import "./interfaces/IBridgeToken.sol";
import "./libraries/MessageLib.sol";
import "./libraries/SignatureVerifier.sol";

contract Bridge is IBridge, Ownable, ReentrancyGuard, Pausable{
    using MessageLib for *;
    using SignatureVerifier for *;

    // State variables
    mapping(address => bool) public validators;
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bool) public processedWithdrawals;
    
    uint256 public minValidators;
    uint256 public depositNonce;
    uint256 public currentChainId;
    
    address public constant NATIVE_TOKEN = address(0);

    // Withdrawal tracking
    struct WithdrawalRequest {
        address token;
        address recipient;
        uint256 amount;
        uint256 nonce;
        uint256 sourceChainId;
        bool processed;
    }

    constructor(address[] memory _validators, uint256 _minValidators, uint256 _chainId) Ownable(msg.sender){
        require(_validators.length >= _minValidators, "Not enough validators");
        require(_minValidators > 0, "Min validators must be > 0");
        
        for (uint256 i = 0; i < _validators.length; i++) {
            require(_validators[i] != address(0), "Invalid validator address");
            validators[_validators[i]] = true;
            emit ValidatorAdded(_validators[i]);
        }
        
        minValidators = _minValidators;
        currentChainId = _chainId;
        
        // Native token is always supported
        supportedTokens[NATIVE_TOKEN] = true;
    }

    function deposit(address token, uint256 amount, address recipient, uint256 targetChainId) external payable override nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(supportedTokens[token], "Token not supported");
        require(targetChainId != currentChainId, "Cannot bridge to same chain");

        if (token == NATIVE_TOKEN) {
            require(msg.value == amount, "Incorrect native token amount");
            // ETH is now in Bridge contract
        } else {
            require(msg.value == 0, "No native token expected");
            
            // Transfer tokens from user to bridge
            (bool success, bytes memory data) = token.call(
                abi.encodeWithSignature(
                    "transferFrom(address,address,uint256)",
                    msg.sender,
                    address(this),
                    amount
                )
            );
            
            require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");
        }

        uint256 nonce = depositNonce++;

        emit Deposit(
            token,
            msg.sender,
            recipient,
            amount,
            nonce,
            targetChainId
        );
    }

    function withdraw(address token, address recipient, uint256 amount, uint256 nonce, uint256 sourceChainId, bytes[] calldata signatures) external override nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(supportedTokens[token], "Token not supported");
        require(sourceChainId != currentChainId, "Invalid source chain");

        bytes32 messageHash = MessageLib.encodeWithdrawMessage(
            token,
            recipient,
            amount,
            nonce,
            sourceChainId,
            currentChainId
        );

        require(!processedWithdrawals[messageHash], "Already processed");

        require(SignatureVerifier.verifySignatures(messageHash, signatures, validators, minValidators),"Invalid signatures");

        processedWithdrawals[messageHash] = true;

        if (token == NATIVE_TOKEN) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Native token transfer failed");
        } else {
            // Try to mint wrapped tokens first
            try IBridgeToken(token).mint(recipient, amount) {
                // Successfully minted
            } catch {
                // If minting fails, transfer from bridge balance
                (bool success, bytes memory data) = token.call(
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        recipient,
                        amount
                    )
                );
                require(success && (data.length == 0 || abi.decode(data, (bool))),"Token transfer failed");
            }
        }

        emit Withdraw(
            token,
            recipient,
            amount,
            nonce,
            sourceChainId
        );
    }

    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator");
        require(!validators[validator], "Already validator");
        
        validators[validator] = true;
        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Not a validator");
        
        validators[validator] = false;
        emit ValidatorRemoved(validator);
    }

    function setMinValidators(uint256 _minValidators) external onlyOwner {
        require(_minValidators > 0, "Must be > 0");
        minValidators = _minValidators;
        emit MinValidatorsUpdated(_minValidators);
    }

    function addSupportedToken(address token) external onlyOwner {
        require(!supportedTokens[token], "Already supported");
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(token != NATIVE_TOKEN, "Cannot remove native token");
        require(supportedTokens[token], "Not supported");
        supportedTokens[token] = false;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency withdraw for owner
    function emergencyWithdraw(address token, address recipient, uint256 amount) external onlyOwner whenPaused {
        require(recipient != address(0), "Invalid recipient");
        
        if (token == NATIVE_TOKEN) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            (bool success, bytes memory data) = token.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    recipient,
                    amount
                )
            );
            require(
                success && (data.length == 0 || abi.decode(data, (bool))),
                "Transfer failed"
            );
        }
    }

    function isValidator(address account) external view returns (bool) {
        return validators[account];
    }

    function isProcessed(bytes32 messageHash) external view returns (bool) {
        return processedWithdrawals[messageHash];
    }

    function getMessageHash(
        address token,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    ) external view returns (bytes32) {
        return MessageLib.encodeWithdrawMessage(
            token,
            recipient,
            amount,
            nonce,
            sourceChainId,
            currentChainId
        );
    }

    // Accept native token
    receive() external payable {}
}