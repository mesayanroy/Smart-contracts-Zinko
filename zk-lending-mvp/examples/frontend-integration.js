// Frontend integration example for ZK Lending MVP
// This shows how to generate proofs and interact with the lending contract

const { ethers } = require("ethers");
const snarkjs = require("snarkjs");

class ZKLendingClient {
  constructor(provider, lendingAddress, verifierAddress) {
    this.provider = provider;
    this.lendingContract = new ethers.Contract(
      lendingAddress,
      [
        "function borrow(uint256 amount, uint[2] a, uint[2][2] b, uint[2] c, uint[] publicSignals) external",
        "function depositCollateral(uint256 amount) external",
        "function repay(uint256 amount) external",
        "function withdrawCollateral(uint256 amount) external",
        "function getMaxBorrowable(address user) external view returns (uint256)",
        "function getPositionHealth(address user) external view returns (uint256)"
      ],
      provider.getSigner()
    );
    this.verifierAddress = verifierAddress;
  }

  /**
   * Generate a ZK proof for borrowing
   * @param {Object} params - Proof parameters
   * @param {string} params.userAddress - User's address
   * @param {string} params.collateralAmount - Amount of collateral (in wei)
   * @param {string} params.collateralPrice - Price of collateral (in wei)
   * @param {string} params.borrowAmount - Amount to borrow (in wei)
   * @param {string} params.collateralizationRatio - Required ratio (e.g., 150 for 150%)
   * @returns {Object} Proof data ready for contract interaction
   */
  async generateBorrowProof(params) {
    const {
      userAddress,
      collateralAmount,
      collateralPrice,
      borrowAmount,
      collateralizationRatio = "150"
    } = params;

    // Create input for the circuit
    const input = {
      userCollateralAmount: collateralAmount,
      collateralPrice: collateralPrice,
      userAddress: userAddress,
      borrowAmount: borrowAmount,
      collateralizationRatio: collateralizationRatio
    };

    console.log("🔐 Generating ZK proof with input:", input);

    try {
      // Generate witness
      const witness = await snarkjs.wtns.calculate(
        input,
        "./circuits/build/collateral_check.wasm",
        "./circuits/witness.wtns"
      );

      // Generate proof
      const { proof, publicSignals } = await snarkjs.groth16.prove(
        "./circuits/build/collateral_check_final.zkey",
        "./circuits/witness.wtns"
      );

      console.log("✅ Proof generated successfully!");
      console.log("Public signals:", publicSignals);

      // Format proof for contract
      const formattedProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][0], proof.pi_b[0][1]],
          [proof.pi_b[1][0], proof.pi_b[1][1]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals: publicSignals
      };

      return formattedProof;
    } catch (error) {
      console.error("❌ Proof generation failed:", error);
      throw error;
    }
  }

  /**
   * Borrow tokens using ZK proof
   * @param {string} amount - Amount to borrow (in wei)
   * @param {Object} proofData - Proof data from generateBorrowProof
   * @returns {Object} Transaction receipt
   */
  async borrow(amount, proofData) {
    console.log(`💰 Borrowing ${ethers.utils.formatEther(amount)} tokens...`);

    try {
      const tx = await this.lendingContract.borrow(
        amount,
        proofData.a,
        proofData.b,
        proofData.c,
        proofData.publicSignals
      );

      console.log("📝 Transaction submitted:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Borrow successful! Gas used:", receipt.gasUsed.toString());

      return receipt;
    } catch (error) {
      console.error("❌ Borrow failed:", error);
      throw error;
    }
  }

  /**
   * Deposit collateral
   * @param {string} amount - Amount to deposit (in wei)
   * @returns {Object} Transaction receipt
   */
  async depositCollateral(amount) {
    console.log(`💎 Depositing ${ethers.utils.formatEther(amount)} collateral...`);

    try {
      const tx = await this.lendingContract.depositCollateral(amount);
      const receipt = await tx.wait();
      console.log("✅ Collateral deposited! Gas used:", receipt.gasUsed.toString());
      return receipt;
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  }

  /**
   * Repay loan
   * @param {string} amount - Amount to repay (in wei)
   * @returns {Object} Transaction receipt
   */
  async repay(amount) {
    console.log(`💳 Repaying ${ethers.utils.formatEther(amount)} tokens...`);

    try {
      const tx = await this.lendingContract.repay(amount);
      const receipt = await tx.wait();
      console.log("✅ Repayment successful! Gas used:", receipt.gasUsed.toString());
      return receipt;
    } catch (error) {
      console.error("❌ Repayment failed:", error);
      throw error;
    }
  }

  /**
   * Withdraw collateral
   * @param {string} amount - Amount to withdraw (in wei)
   * @returns {Object} Transaction receipt
   */
  async withdrawCollateral(amount) {
    console.log(`💎 Withdrawing ${ethers.utils.formatEther(amount)} collateral...`);

    try {
      const tx = await this.lendingContract.withdrawCollateral(amount);
      const receipt = await tx.wait();
      console.log("✅ Collateral withdrawn! Gas used:", receipt.gasUsed.toString());
      return receipt;
    } catch (error) {
      console.error("❌ Withdrawal failed:", error);
      throw error;
    }
  }

  /**
   * Get user's maximum borrowable amount
   * @param {string} userAddress - User's address
   * @returns {string} Maximum borrowable amount (in wei)
   */
  async getMaxBorrowable(userAddress) {
    try {
      const maxBorrowable = await this.lendingContract.getMaxBorrowable(userAddress);
      return maxBorrowable.toString();
    } catch (error) {
      console.error("❌ Failed to get max borrowable:", error);
      throw error;
    }
  }

  /**
   * Get user's position health
   * @param {string} userAddress - User's address
   * @returns {string} Position health percentage
   */
  async getPositionHealth(userAddress) {
    try {
      const health = await this.lendingContract.getPositionHealth(userAddress);
      return health.toString();
    } catch (error) {
      console.error("❌ Failed to get position health:", error);
      throw error;
    }
  }
}

// Example usage
async function example() {
  // Setup provider and contracts
  const provider = new ethers.providers.JsonRpcProvider("https://testnet.evm.nodes.onflow.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const lendingAddress = "0x..."; // Deployed lending contract address
  const verifierAddress = "0x..."; // Deployed verifier address
  
  const client = new ZKLendingClient(provider, lendingAddress, verifierAddress);

  try {
    // 1. Deposit collateral
    await client.depositCollateral(ethers.utils.parseEther("100"));

    // 2. Generate proof for borrowing
    const proofData = await client.generateBorrowProof({
      userAddress: wallet.address,
      collateralAmount: ethers.utils.parseEther("100").toString(),
      collateralPrice: ethers.utils.parseEther("2000").toString(), // $2000 per token
      borrowAmount: ethers.utils.parseEther("50").toString(),
      collateralizationRatio: "150"
    });

    // 3. Borrow using ZK proof
    await client.borrow(ethers.utils.parseEther("50"), proofData);

    // 4. Check position health
    const health = await client.getPositionHealth(wallet.address);
    console.log("Position health:", health, "%");

  } catch (error) {
    console.error("Example failed:", error);
  }
}

module.exports = { ZKLendingClient };
