// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISnarkJSVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external view returns (bool);
}

interface IPriceOracle {
    function getLatestPrice() external view returns (int256, uint8);
}

contract ZKLending is Ownable, ReentrancyGuard {
    IERC20 public stableToken;       // token lent out (e.g., USDC)
    IERC20 public collateralToken;   // token used as collateral
    ISnarkJSVerifier public verifier;     // deployed verifier contract
    IPriceOracle public priceOracle; // wrapper to get collateral price

    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public borrowBalance;

    uint256 public liquidationThreshold = 75; // percent (e.g., 75%)
    uint256 public collateralizationRatio = 150; // 150% collateralization required

    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount, bytes proof);
    event Repay(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Liquidation(address indexed user, uint256 collateralAmount, uint256 debtAmount);

    constructor(address _stable, address _collateral, address _verifier, address _priceOracle) {
        stableToken = IERC20(_stable);
        collateralToken = IERC20(_collateral);
        verifier = ISnarkJSVerifier(_verifier);
        priceOracle = IPriceOracle(_priceOracle);
    }

    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        collateralBalance[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    // Borrow requires a ZK proof showing: userCollateralValue >= requiredCollateralFor(amount)
    // SnarkJS proof format: a, b, c arrays and publicSignals
    function borrow(
        uint256 amount,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicSignals
    ) external nonReentrant {
        require(amount > 0, "amount=0");
        require(borrowBalance[msg.sender] + amount <= getMaxBorrowable(msg.sender), "Exceeds max borrowable");

        // Verify ZK proof using SnarkJS format
        bool proofValid = verifier.verifyProof(a, b, c, publicSignals);
        require(proofValid, "Invalid ZK proof");

        // Verify public signals match expected values
        require(publicSignals.length >= 2, "Invalid public signals");
        require(publicSignals[0] == uint256(uint160(msg.sender)), "User address mismatch");
        require(publicSignals[1] == amount, "Borrow amount mismatch");

        // Simple bookkeeping — real system must check more (interest, caps, re-entrancy)
        borrowBalance[msg.sender] += amount;
        require(stableToken.transfer(msg.sender, amount), "Transfer failed");

        emit Borrow(msg.sender, amount, abi.encode(a, b, c));
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(stableToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (amount >= borrowBalance[msg.sender]) {
            borrowBalance[msg.sender] = 0;
        } else {
            borrowBalance[msg.sender] -= amount;
        }
        emit Repay(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        require(amount <= collateralBalance[msg.sender], "Insufficient collateral");
        
        // Check if position remains solvent after withdrawal
        uint256 remainingCollateral = collateralBalance[msg.sender] - amount;
        require(isPositionSolvent(msg.sender, remainingCollateral), "Position would become insolvent");

        collateralBalance[msg.sender] -= amount;
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdraw(msg.sender, amount);
    }

    function liquidate(address user) external nonReentrant {
        require(!isPositionSolvent(user, collateralBalance[user]), "Position is solvent");
        
        uint256 collateralAmount = collateralBalance[user];
        uint256 debtAmount = borrowBalance[user];
        
        // Transfer collateral to liquidator
        collateralBalance[user] = 0;
        borrowBalance[user] = 0;
        
        require(collateralToken.transfer(msg.sender, collateralAmount), "Collateral transfer failed");
        require(stableToken.transferFrom(msg.sender, address(this), debtAmount), "Debt payment failed");
        
        emit Liquidation(user, collateralAmount, debtAmount);
    }

    function getMaxBorrowable(address user) public view returns (uint256) {
        (int256 price, uint8 decimals) = priceOracle.getLatestPrice();
        require(price > 0, "Invalid price");
        
        uint256 collateralValue = (collateralBalance[user] * uint256(price)) / (10 ** decimals);
        return (collateralValue * 100) / collateralizationRatio;
    }

    function isPositionSolvent(address user, uint256 collateralAmount) public view returns (bool) {
        if (borrowBalance[user] == 0) return true;
        
        (int256 price, uint8 decimals) = priceOracle.getLatestPrice();
        require(price > 0, "Invalid price");
        
        uint256 collateralValue = (collateralAmount * uint256(price)) / (10 ** decimals);
        uint256 requiredCollateral = (borrowBalance[user] * collateralizationRatio) / 100;
        
        return collateralValue >= requiredCollateral;
    }

    function getPositionHealth(address user) public view returns (uint256) {
        if (borrowBalance[user] == 0) return type(uint256).max;
        
        (int256 price, uint8 decimals) = priceOracle.getLatestPrice();
        require(price > 0, "Invalid price");
        
        uint256 collateralValue = (collateralBalance[user] * uint256(price)) / (10 ** decimals);
        uint256 requiredCollateral = (borrowBalance[user] * collateralizationRatio) / 100;
        
        return (collateralValue * 100) / requiredCollateral;
    }

    // Admin: update verifier (for upgrades)
    function setVerifier(address _verifier) external onlyOwner {
        verifier = ISnarkJSVerifier(_verifier);
    }

    function setPriceOracle(address _oracle) external onlyOwner {
        priceOracle = IPriceOracle(_oracle);
    }

    function setCollateralizationRatio(uint256 _ratio) external onlyOwner {
        require(_ratio >= 100, "Ratio must be >= 100%");
        collateralizationRatio = _ratio;
    }

    function setLiquidationThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold <= 100, "Threshold must be <= 100%");
        liquidationThreshold = _threshold;
    }
}
