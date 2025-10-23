const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔨 Compiling Circom circuit...");

try {
  // Ensure build directory exists
  const buildDir = path.join(__dirname, "../circuits/build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Compile the circuit
  const circuitPath = path.join(__dirname, "../circuits/collateral_check.circom");
  const outputPath = path.join(__dirname, "../circuits/build");
  
  console.log(`Compiling circuit: ${circuitPath}`);
  console.log(`Output directory: ${outputPath}`);

  const command = `circom ${circuitPath} --r1cs --wasm --sym -o ${outputPath}`;
  console.log(`Running: ${command}`);
  
  execSync(command, { stdio: "inherit" });
  
  console.log("✅ Circuit compiled successfully!");
  console.log("Generated files:");
  console.log("- collateral_check.r1cs");
  console.log("- collateral_check.wasm");
  console.log("- collateral_check.sym");
  console.log("- collateral_check_js/ (JavaScript files)");
  
} catch (error) {
  console.error("❌ Circuit compilation failed:", error.message);
  process.exit(1);
}
