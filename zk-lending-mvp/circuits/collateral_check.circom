pragma circom 2.0.0;

// Circuit to verify that a user has sufficient collateral to borrow
// This is a simplified example - in production, you'd want more sophisticated logic

template CollateralCheck() {
    // Private inputs (witnesses)
    signal private input userCollateralAmount;     // Amount of collateral user has
    signal private input collateralPrice;          // Price of collateral token
    signal private input userAddress;              // User's address (for verification)
    signal private input borrowAmount;             // Amount user wants to borrow
    signal private input collateralizationRatio;   // Required collateralization ratio (e.g., 150 for 150%)
    
    // Public inputs (public signals)
    signal output userAddressHash;                 // Hash of user address for verification
    signal output borrowAmountHash;                // Hash of borrow amount
    signal output collateralValue;                 // Total collateral value
    signal output maxBorrowable;                   // Maximum amount user can borrow
    signal output canBorrow;                       // Boolean: can user borrow this amount?
    
    // Intermediate signals
    signal collateralValueCalc;
    signal maxBorrowableCalc;
    signal borrowCheck;
    
    // Calculate collateral value (collateralAmount * price)
    collateralValueCalc <== userCollateralAmount * collateralPrice;
    collateralValue <== collateralValueCalc;
    
    // Calculate maximum borrowable amount
    // maxBorrowable = (collateralValue * 100) / collateralizationRatio
    maxBorrowableCalc <== (collateralValue * 100) / collateralizationRatio;
    maxBorrowable <== maxBorrowableCalc;
    
    // Check if user can borrow the requested amount
    borrowCheck <== borrowAmount <= maxBorrowable ? 1 : 0;
    canBorrow <== borrowCheck;
    
    // Hash user address for public verification
    // This ensures the proof is tied to a specific user
    userAddressHash <== userAddress;
    
    // Hash borrow amount for public verification
    borrowAmountHash <== borrowAmount;
    
    // Constraint: user must have enough collateral
    borrowAmount * collateralizationRatio <= collateralValue * 100;
}

// Main component
component main = CollateralCheck();
