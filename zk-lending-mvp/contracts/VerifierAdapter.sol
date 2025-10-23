// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";

/**
 * @title VerifierAdapter
 * @dev Adapter contract to convert between different proof formats
 * This contract provides a bridge between SnarkJS proof format and our lending contract
 */
contract VerifierAdapter {
    Verifier public immutable verifier;
    
    constructor(address _verifier) {
        verifier = Verifier(_verifier);
    }
    
    /**
     * @dev Verify a SnarkJS proof with the standard format
     * @param a Proof component a (2 elements)
     * @param b Proof component b (2x2 matrix)
     * @param c Proof component c (2 elements)
     * @param input Public inputs to the circuit
     * @return bool True if proof is valid
     */
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external view returns (bool) {
        return verifier.verifyProof(a, b, c, input);
    }
    
    /**
     * @dev Verify proof with additional validation for lending use case
     * @param a Proof component a
     * @param b Proof component b
     * @param c Proof component c
     * @param input Public inputs
     * @param expectedUser Expected user address (must match input[0])
     * @param expectedAmount Expected borrow amount (must match input[1])
     * @return bool True if proof is valid and matches expected values
     */
    function verifyProofWithValidation(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input,
        address expectedUser,
        uint256 expectedAmount
    ) external view returns (bool) {
        // Verify the proof first
        bool proofValid = verifier.verifyProof(a, b, c, input);
        if (!proofValid) return false;
        
        // Validate public inputs
        if (input.length < 2) return false;
        if (input[0] != uint256(uint160(expectedUser))) return false;
        if (input[1] != expectedAmount) return false;
        
        return true;
    }
    
    /**
     * @dev Get the verifier contract address
     * @return address The verifier contract address
     */
    function getVerifier() external view returns (address) {
        return address(verifier);
    }
}
