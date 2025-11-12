// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MessageLib.sol";

library SignatureVerifier {
     function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
          require(signature.length == 65, "Invalid signature length");

          bytes32 r;
          bytes32 s;
          uint8 v;

          assembly {
               r := mload(add(signature, 32))
               s := mload(add(signature, 64))
               v := byte(0, mload(add(signature, 96)))
          }

          if (v < 27) {
               v += 27;
          }

          require(v == 27 || v == 28, "Invalid signature v value");

          return ecrecover(ethSignedMessageHash, v, r, s);
     }

     function verifySignatures(bytes32 messageHash, bytes[] memory signatures, mapping(address => bool) storage validators, uint256 minValidators) internal view returns (bool) {
          require(signatures.length >= minValidators, "Insufficient signatures");

          bytes32 ethSignedMessageHash = MessageLib.toEthSignedMessageHash(messageHash);
          address[] memory signers = new address[](signatures.length);

          for (uint256 i = 0; i < signatures.length; i++) {
               address signer = recoverSigner(ethSignedMessageHash, signatures[i]);
               
               require(validators[signer], "Invalid validator signature");
               
               // Check for duplicate signers
               for (uint256 j = 0; j < i; j++) {
                    require(signers[j] != signer, "Duplicate signature");
               }
               
               signers[i] = signer;
          }

          return true;
     }
}
