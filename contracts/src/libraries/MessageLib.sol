// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MessageLib {
     // https://dev.to/truongpx396/understanding-ethereum-ecdsa-eip-712-and-its-role-in-permit-functionality-26ll
     function encodeWithdrawMessage(address token, address recipient, uint256 amount, uint256 nonce, uint256 sourceChainId, uint256 targetChainId ) internal pure returns (bytes32) {
          return keccak256(abi.encodePacked(
                    token,
                    recipient,
                    amount,
                    nonce,
                    sourceChainId,
                    targetChainId
               )
          );
     }

     function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
          return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
     }
}