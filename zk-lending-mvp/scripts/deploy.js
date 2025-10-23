const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Verifier (SnarkJS-generated)
  console.log("\n=== Deploying Verifier ===");
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // Deploy VerifierAdapter (optional, for easier integration)
  console.log("\n=== Deploying VerifierAdapter ===");
  const VerifierAdapter = await ethers.getContractFactory("VerifierAdapter");
  const verifierAdapter = await VerifierAdapter.deploy(verifier.address);
  await verifierAdapter.deployed();
  console.log("VerifierAdapter deployed to:", verifierAdapter.address);

  // Deploy ChainlinkPriceOracle
  console.log("\n=== Deploying ChainlinkPriceOracle ===");
  const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
  
  // For Flow EVM testnet, you need to check available Chainlink feeds
  // If no Chainlink feeds are available, use a mock address
  const priceFeedAddress = process.env.CHAINLINK_FEED || ethers.constants.AddressZero;
  console.log("Using price feed address:", priceFeedAddress);
  
  const oracle = await ChainlinkPriceOracle.deploy(priceFeedAddress);
  await oracle.deployed();
  console.log("ChainlinkPriceOracle deployed to:", oracle.address);

  // Deploy ZKLending
  console.log("\n=== Deploying ZKLending ===");
  const ZKLending = await ethers.getContractFactory("ZKLending");
  
  // These should be set in your .env file for Flow EVM testnet
  const stableToken = process.env.STABLE_TOKEN || ethers.constants.AddressZero;
  const collateralToken = process.env.COLLATERAL_TOKEN || ethers.constants.AddressZero;
  
  console.log("Stable token address:", stableToken);
  console.log("Collateral token address:", collateralToken);
  console.log("Verifier address:", verifier.address);
  console.log("Oracle address:", oracle.address);

  const lending = await ZKLending.deploy(
    stableToken,
    collateralToken,
    verifier.address, // Use the real SnarkJS verifier
    oracle.address
  );
  await lending.deployed();
  console.log("ZKLending deployed to:", lending.address);

  // Display deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("ZKVerifier:", verifier.address);
  console.log("ChainlinkPriceOracle:", oracle.address);
  console.log("ZKLending:", lending.address);
  console.log("Stable Token:", stableToken);
  console.log("Collateral Token:", collateralToken);

  // Save deployment addresses to a file for easy reference
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      Verifier: verifier.address,
      VerifierAdapter: verifierAdapter.address,
      ChainlinkPriceOracle: oracle.address,
      ZKLending: lending.address,
      StableToken: stableToken,
      CollateralToken: collateralToken,
    },
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-info.json");

  // Verify contracts if on testnet/mainnet
  if (process.env.VERIFY_CONTRACTS === "true") {
    console.log("\n=== Verifying Contracts ===");
    try {
      await hre.run("verify:verify", {
        address: verifier.address,
        constructorArguments: [],
      });
      console.log("Verifier verified");
    } catch (error) {
      console.log("Verifier verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: verifierAdapter.address,
        constructorArguments: [verifier.address],
      });
      console.log("VerifierAdapter verified");
    } catch (error) {
      console.log("VerifierAdapter verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: oracle.address,
        constructorArguments: [priceFeedAddress],
      });
      console.log("ChainlinkPriceOracle verified");
    } catch (error) {
      console.log("ChainlinkPriceOracle verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: lending.address,
        constructorArguments: [stableToken, collateralToken, verifier.address, oracle.address],
      });
      console.log("ZKLending verified");
    } catch (error) {
      console.log("ZKLending verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
