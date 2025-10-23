const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKLending", function () {
  let zkLending;
  let zkVerifier;
  let priceOracle;
  let stableToken;
  let collateralToken;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    stableToken = await MockERC20.deploy("Stable Token", "ST", ethers.utils.parseEther("1000000"));
    collateralToken = await MockERC20.deploy("Collateral Token", "CT", ethers.utils.parseEther("1000000"));

    // Deploy ZKVerifier
    const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
    zkVerifier = await ZKVerifier.deploy();

    // Deploy mock price oracle
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    priceOracle = await MockPriceOracle.deploy();

    // Deploy ZKLending
    const ZKLending = await ethers.getContractFactory("ZKLending");
    zkLending = await ZKLending.deploy(
      stableToken.address,
      collateralToken.address,
      zkVerifier.address,
      priceOracle.address
    );

    // Mint tokens to users
    await stableToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await collateralToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await stableToken.mint(user2.address, ethers.utils.parseEther("1000"));
    await collateralToken.mint(user2.address, ethers.utils.parseEther("1000"));

    // Approve lending contract
    await stableToken.connect(user1).approve(zkLending.address, ethers.utils.parseEther("1000"));
    await collateralToken.connect(user1).approve(zkLending.address, ethers.utils.parseEther("1000"));
    await stableToken.connect(user2).approve(zkLending.address, ethers.utils.parseEther("1000"));
    await collateralToken.connect(user2).approve(zkLending.address, ethers.utils.parseEther("1000"));
  });

  describe("Deposit Collateral", function () {
    it("Should allow users to deposit collateral", async function () {
      const amount = ethers.utils.parseEther("100");
      await expect(zkLending.connect(user1).depositCollateral(amount))
        .to.emit(zkLending, "Deposit")
        .withArgs(user1.address, amount);

      expect(await zkLending.collateralBalance(user1.address)).to.equal(amount);
    });

    it("Should reject zero amount deposits", async function () {
      await expect(zkLending.connect(user1).depositCollateral(0))
        .to.be.revertedWith("amount=0");
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // Deposit collateral first
      await zkLending.connect(user1).depositCollateral(ethers.utils.parseEther("100"));
    });

    it("Should allow borrowing with valid proof", async function () {
      const borrowAmount = ethers.utils.parseEther("50");
      const proof = "0x"; // Mock proof
      const pubSignals = [1, 2, 3]; // Mock public signals

      await expect(zkLending.connect(user1).borrow(borrowAmount, proof, pubSignals))
        .to.emit(zkLending, "Borrow")
        .withArgs(user1.address, borrowAmount, proof);

      expect(await zkLending.borrowBalance(user1.address)).to.equal(borrowAmount);
    });

    it("Should reject zero amount borrows", async function () {
      const proof = "0x";
      const pubSignals = [1, 2, 3];

      await expect(zkLending.connect(user1).borrow(0, proof, pubSignals))
        .to.be.revertedWith("amount=0");
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // Deposit collateral and borrow
      await zkLending.connect(user1).depositCollateral(ethers.utils.parseEther("100"));
      await zkLending.connect(user1).borrow(ethers.utils.parseEther("50"), "0x", [1, 2, 3]);
    });

    it("Should allow partial repayment", async function () {
      const repayAmount = ethers.utils.parseEther("25");
      await expect(zkLending.connect(user1).repay(repayAmount))
        .to.emit(zkLending, "Repay")
        .withArgs(user1.address, repayAmount);

      expect(await zkLending.borrowBalance(user1.address)).to.equal(ethers.utils.parseEther("25"));
    });

    it("Should allow full repayment", async function () {
      const repayAmount = ethers.utils.parseEther("50");
      await expect(zkLending.connect(user1).repay(repayAmount))
        .to.emit(zkLending, "Repay")
        .withArgs(user1.address, repayAmount);

      expect(await zkLending.borrowBalance(user1.address)).to.equal(0);
    });
  });

  describe("Withdraw Collateral", function () {
    beforeEach(async function () {
      // Deposit collateral
      await zkLending.connect(user1).depositCollateral(ethers.utils.parseEther("100"));
    });

    it("Should allow withdrawing collateral when no debt", async function () {
      const withdrawAmount = ethers.utils.parseEther("50");
      await expect(zkLending.connect(user1).withdrawCollateral(withdrawAmount))
        .to.emit(zkLending, "Withdraw")
        .withArgs(user1.address, withdrawAmount);

      expect(await zkLending.collateralBalance(user1.address)).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set verifier", async function () {
      const newVerifier = await ethers.getContractFactory("ZKVerifier");
      const newVerifierInstance = await newVerifier.deploy();
      
      await zkLending.setVerifier(newVerifierInstance.address);
      expect(await zkLending.verifier()).to.equal(newVerifierInstance.address);
    });

    it("Should allow owner to set price oracle", async function () {
      const newOracle = await ethers.getContractFactory("MockPriceOracle");
      const newOracleInstance = await newOracle.deploy();
      
      await zkLending.setPriceOracle(newOracleInstance.address);
      expect(await zkLending.priceOracle()).to.equal(newOracleInstance.address);
    });

    it("Should reject non-owner from admin functions", async function () {
      await expect(zkLending.connect(user1).setVerifier(ethers.constants.AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
