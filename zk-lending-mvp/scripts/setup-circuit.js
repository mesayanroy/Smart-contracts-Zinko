const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔐 Setting up Groth16 trusted setup...");

try {
  const circuitsDir = path.join(__dirname, "../circuits");
  const buildDir = path.join(circuitsDir, "build");
  
  // Check if R1CS file exists
  const r1csFile = path.join(buildDir, "collateral_check.r1cs");
  if (!fs.existsSync(r1csFile)) {
    console.error("❌ R1CS file not found. Please compile the circuit first:");
    console.error("npm run circuit:compile");
    process.exit(1);
  }

  // Check if Powers of Tau file exists
  const potFile = path.join(__dirname, "../pot12_final.ptau");
  if (!fs.existsSync(potFile)) {
    console.log("📥 Downloading Powers of Tau file...");
    const downloadCommand = `wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final.ptau -O ${potFile}`;
    execSync(downloadCommand, { stdio: "inherit" });
  }

  // Phase 1: Setup
  console.log("Phase 1: Groth16 setup...");
  const setupCommand = `snarkjs groth16 setup ${r1csFile} ${potFile} ${path.join(buildDir, "collateral_check_0000.zkey")}`;
  execSync(setupCommand, { stdio: "inherit" });

  // Phase 2: Contribute to ceremony
  console.log("Phase 2: Contributing to ceremony...");
  const contributeCommand = `snarkjs zkey contribute ${path.join(buildDir, "collateral_check_0000.zkey")} ${path.join(buildDir, "collateral_check_final.zkey")} --name="first contribution"`;
  execSync(contributeCommand, { stdio: "inherit" });

  // Export verification key
  console.log("Exporting verification key...");
  const exportVkCommand = `snarkjs zkey export verificationkey ${path.join(buildDir, "collateral_check_final.zkey")} ${path.join(buildDir, "verification_key.json")}`;
  execSync(exportVkCommand, { stdio: "inherit" });

  console.log("✅ Trusted setup completed successfully!");
  console.log("Generated files:");
  console.log("- collateral_check_0000.zkey");
  console.log("- collateral_check_final.zkey");
  console.log("- verification_key.json");
  
} catch (error) {
  console.error("❌ Trusted setup failed:", error.message);
  process.exit(1);
}
