// SPDX-License-Identifier: UNLICENSED
// Solidity contract for DID registry with create and verify functions
// contracts/DIDRegistry.sol
pragma solidity ^0.8.0;

/// @title DID Registry
/// @notice Minimal registry to store a user's public key and CCCD hash (Vietnam) and verify signatures
contract DIDRegistry {
    /// @notice Maps a user address to their public key bytes
    mapping(address => bytes) public publicKeys;

    /// @notice Maps a user address to the hash of their CCCD (national ID document)
    mapping(address => string) public cccdHashes; // Hash of CCCD for Vietnam anchor

    /// @notice Emitted when a DID is created for a user
    /// @param user Address of the user who created the DID
    /// @param cccdHash Hash of the user's CCCD stored as an anchor
    event DIDCreated(address indexed user, string cccdHash);

    /// @notice Create a DID for sender by storing their public key and CCCD hash
    /// @param _cccdHash Hash of the sender's CCCD (off-chain anchor)
    /// @param _publicKey The sender's public key bytes (e.g., compressed/uncompressed key)
    function createDID(string memory _cccdHash, bytes memory _publicKey) public {
        require(publicKeys[msg.sender].length == 0, "DID already exists");
        publicKeys[msg.sender] = _publicKey;
        cccdHashes[msg.sender] = _cccdHash;
        emit DIDCreated(msg.sender, _cccdHash);
    }

    /// @notice Verify an Ethereum signed message against a user's address
    /// @param user Address expected to have signed the message
    /// @param messageHash Keccak256 hash of the original message
    /// @param signature 65-byte Ethereum signature (r || s || v)
    /// @return True if the signature was produced by `user`
    function verifySignature(address user, bytes32 messageHash, bytes memory signature) public pure returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address recovered = ecrecover(ethSignedMessageHash, v, r, s);
        return recovered == user;
    }

    /// @notice Split a 65-byte signature into r, s and v values
    /// @dev Uses inline assembly for gas-efficient parsing. v is normalized to 27/28.
    /// @param sig The signature bytes
    /// @return r The r component
    /// @return s The s component
    /// @return v The recovery id (27 or 28)
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        // solhint-disable-next-line no-inline-assembly
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // Old versions of Ethereum signatures use v in {27,28},
        // some clients return {0,1} — normalize to 27/28
        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "invalid v value");
    }
}