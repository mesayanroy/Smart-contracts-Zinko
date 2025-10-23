const snarkjs = require("snarkjs");
const fs = require("fs");

async function generateProof() {
  console.log("Generating proof for collateral check circuit...");

  try {
    // Read the input file
    const input = JSON.parse(fs.readFileSync("circuits/input.json", "utf8"));
    console.log("Input:", input);

    // Generate witness
    console.log("Generating witness...");
    const { execSync } = require("child_process");
    execSync(
      "node circuits/build/collateral_check_js/generate_witness.js circuits/build/collateral_check_js/collateral_check.wasm circuits/input.json circuits/witness.wtns",
      { stdio: "inherit" }
    );

    // Generate proof
    console.log("Generating proof...");
    const { proof, publicSignals } = await snarkjs.groth16.prove(
      "circuits/build/collateral_check_0000.zkey",
      "circuits/witness.wtns"
    );

    // Save proof and public signals
    fs.writeFileSync("circuits/proof.json", JSON.stringify(proof, null, 2));
    fs.writeFileSync("circuits/public.json", JSON.stringify(publicSignals, null, 2));

    console.log("Proof generated successfully!");
    console.log("Public signals:", publicSignals);

    // Verify the proof locally
    console.log("Verifying proof locally...");
    const vKey = JSON.parse(fs.readFileSync("circuits/verification_key.json", "utf8"));
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.log("Proof is valid:", isValid);

    return { proof, publicSignals };
  } catch (error) {
    console.error("Error generating proof:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateProof()
    .then(() => {
      console.log("Proof generation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Proof generation failed:", error);
      process.exit(1);
    });
}

module.exports = { generateProof };
