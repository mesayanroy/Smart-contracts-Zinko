const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔐 Generating ZK proof...");

try {
  const circuitsDir = path.join(__dirname, "../circuits");
  const buildDir = path.join(circuitsDir, "build");
  
  // Check if required files exist
  const wasmFile = path.join(buildDir, "collateral_check.wasm");
  const zkeyFile = path.join(buildDir, "collateral_check_final.zkey");
  const inputFile = path.join(circuitsDir, "input.json");
  
  if (!fs.existsSync(wasmFile)) {
    console.error("❌ WASM file not found. Please compile the circuit first:");
    console.error("npm run circuit:compile");
    process.exit(1);
  }
  
  if (!fs.existsSync(zkeyFile)) {
    console.error("❌ ZKey file not found. Please run trusted setup first:");
    console.error("npm run circuit:setup");
    process.exit(1);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error("❌ Input file not found. Please create circuits/input.json");
    process.exit(1);
  }

  // Generate witness
  console.log("Generating witness...");
  const witnessCommand = `node ${path.join(buildDir, "collateral_check_js/generate_witness.js")} ${wasmFile} ${inputFile} ${path.join(circuitsDir, "witness.wtns")}`;
  execSync(witnessCommand, { stdio: "inherit" });

  // Generate proof
  console.log("Generating proof...");
  const proveCommand = `snarkjs groth16 prove ${zkeyFile} ${path.join(circuitsDir, "witness.wtns")} ${path.join(circuitsDir, "proof.json")} ${path.join(circuitsDir, "public.json")}`;
  execSync(proveCommand, { stdio: "inherit" });

  // Verify proof locally
  console.log("Verifying proof locally...");
  const verifyCommand = `snarkjs groth16 verify ${path.join(buildDir, "verification_key.json")} ${path.join(circuitsDir, "public.json")} ${path.join(circuitsDir, "proof.json")}`;
  execSync(verifyCommand, { stdio: "inherit" });

  console.log("✅ Proof generated and verified successfully!");
  console.log("Generated files:");
  console.log("- witness.wtns");
  console.log("- proof.json");
  console.log("- public.json");
  
  // Display proof details
  const proof = JSON.parse(fs.readFileSync(path.join(circuitsDir, "proof.json"), "utf8"));
  const publicSignals = JSON.parse(fs.readFileSync(path.join(circuitsDir, "public.json"), "utf8"));
  
  console.log("\n📋 Proof Details:");
  console.log("Public signals:", publicSignals);
  console.log("Proof components:");
  console.log("- pi_a:", proof.pi_a);
  console.log("- pi_b:", proof.pi_b);
  console.log("- pi_c:", proof.pi_c);
  
} catch (error) {
  console.error("❌ Proof generation failed:", error.message);
  process.exit(1);
}
