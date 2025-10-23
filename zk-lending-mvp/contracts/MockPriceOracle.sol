// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPriceOracle is Ownable {
    int256 public price = 2000 * 10**18; // $2000 per token
    uint8 public decimals = 18;

    function getLatestPrice() external view returns (int256, uint8) {
        return (price, decimals);
    }

    function setPrice(int256 _price) external onlyOwner {
        price = _price;
    }

    function setDecimals(uint8 _decimals) external onlyOwner {
        decimals = _decimals;
    }
}
