const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📤 Exporting Solidity verifier...");

try {
  const circuitsDir = path.join(__dirname, "../circuits");
  const buildDir = path.join(circuitsDir, "build");
  const contractsDir = path.join(__dirname, "../contracts");
  
  // Check if final zkey exists
  const zkeyFile = path.join(buildDir, "collateral_check_final.zkey");
  if (!fs.existsSync(zkeyFile)) {
    console.error("❌ Final zkey file not found. Please run trusted setup first:");
    console.error("npm run circuit:setup");
    process.exit(1);
  }

  // Export Solidity verifier
  console.log("Exporting Solidity verifier contract...");
  const exportCommand = `snarkjs zkey export solidityverifier ${zkeyFile} ${path.join(contractsDir, "Verifier.sol")}`;
  execSync(exportCommand, { stdio: "inherit" });

  console.log("✅ Solidity verifier exported successfully!");
  console.log(`Verifier contract saved to: ${path.join(contractsDir, "Verifier.sol")}`);
  
  // Display some info about the generated verifier
  const verifierPath = path.join(contractsDir, "Verifier.sol");
  if (fs.existsSync(verifierPath)) {
    const stats = fs.statSync(verifierPath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log("⚠️  IMPORTANT: This replaces the placeholder Verifier.sol!");
    console.log("⚠️  Make sure to test the generated verifier before deployment!");
  }
  
} catch (error) {
  console.error("❌ Verifier export failed:", error.message);
  process.exit(1);
}
