# 🚀 ZK Lending MVP - Production Deployment Guide

This guide covers the complete deployment process for the ZK Lending MVP on Flow EVM, including SnarkJS integration and production considerations.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Install global ZK tools
npm install -g circom snarkjs

# Configure environment
cp env.example .env
# Edit .env with your configuration
```

### 2. Circuit Setup (Required)

```bash
# Complete circuit setup (one command)
npm run circuit:full-setup

# Or step by step:
npm run circuit:compile    # Compile Circom circuit
npm run circuit:setup     # Trusted setup ceremony
npm run circuit:export-verifier  # Generate Solidity verifier
```

**⚠️ CRITICAL**: The `circuit:export-verifier` command replaces `contracts/Verifier.sol` with the real SnarkJS-generated verifier. This is required before deployment.

### 3. Test Circuit Integration

```bash
# Test proof generation
npm run circuit:generate-proof

# Verify the generated proof
node -e "
const proof = require('./circuits/proof.json');
const public = require('./circuits/public.json');
console.log('Proof generated:', !!proof.pi_a);
console.log('Public signals:', public);
"
```

## 🔧 Contract Deployment

### 1. Deploy to Flow EVM Testnet

```bash
# Deploy all contracts
npm run deploy:testnet

# Check deployment
cat deployment-info.json
```

### 2. Verify Contracts (Optional)

```bash
# Set verification flag
export VERIFY_CONTRACTS=true

# Redeploy with verification
npm run deploy:testnet
```

### 3. Deploy to Flow EVM Mainnet

```bash
# Update hardhat.config.js for mainnet
# Deploy to mainnet
npm run deploy:mainnet
```

## 🔐 ZK Proof Integration

### 1. Frontend Integration

```javascript
const { ZKLendingClient } = require("./examples/frontend-integration");

// Initialize client
const client = new ZKLendingClient(
  provider,
  lendingContractAddress,
  verifierAddress
);

// Generate proof and borrow
const proofData = await client.generateBorrowProof({
  userAddress: userAddress,
  collateralAmount: "1000000000000000000", // 1 ETH in wei
  collateralPrice: "2000000000000000000000", // $2000 in wei
  borrowAmount: "50000000000000000000", // 50 USDC in wei
  collateralizationRatio: "150"
});

await client.borrow("50000000000000000000", proofData);
```

### 2. Backend Integration

```javascript
// Generate proof on backend
const { generateProof } = require("./circuits/generate_proof");

const proofData = await generateProof({
  userCollateralAmount: "1000000000000000000",
  collateralPrice: "2000000000000000000000",
  userAddress: "0x...",
  borrowAmount: "50000000000000000000",
  collateralizationRatio: "150"
});

// Send to frontend for contract interaction
```

## 🧪 Testing

### 1. Unit Tests

```bash
npm test
```

### 2. Integration Tests

```bash
# Start local node
npm run node

# Deploy to local network
npm run deploy:local

# Run integration tests
npx hardhat test --network localhost
```

### 3. Circuit Tests

```bash
# Test circuit compilation
npm run circuit:compile

# Test proof generation
npm run circuit:generate-proof

# Verify proof locally
snarkjs groth16 verify \
  circuits/build/verification_key.json \
  circuits/public.json \
  circuits/proof.json
```

## 🔍 Monitoring & Maintenance

### 1. Contract Monitoring

```javascript
// Monitor contract events
const lending = new ethers.Contract(lendingAddress, abi, provider);

lending.on("Borrow", (user, amount, proof) => {
  console.log(`User ${user} borrowed ${amount}`);
});

lending.on("Liquidation", (user, collateralAmount, debtAmount) => {
  console.log(`User ${user} liquidated: ${collateralAmount} collateral for ${debtAmount} debt`);
});
```

### 2. Gas Optimization

- **Verifier Gas**: ~200k-500k gas per proof verification
- **Circuit Size**: Larger circuits = more gas
- **Batch Operations**: Consider batching multiple operations

### 3. Security Considerations

- **Verifier Upgrade**: Use `setVerifier()` for upgrades
- **Oracle Updates**: Use `setPriceOracle()` for oracle changes
- **Access Control**: Monitor admin functions
- **Reentrancy**: Already protected with `ReentrancyGuard`

## 🚨 Production Considerations

### 1. Security Audit

Before mainnet deployment:
- [ ] Professional security audit
- [ ] Circuit logic review
- [ ] Smart contract audit
- [ ] ZK proof system audit

### 2. Trusted Setup

For production:
- [ ] Secure trusted setup ceremony
- [ ] Multiple participants
- [ ] Destroy toxic waste
- [ ] Verify ceremony integrity

### 3. Infrastructure

- [ ] Reliable RPC endpoints
- [ ] Backup price oracles
- [ ] Monitoring systems
- [ ] Emergency procedures

### 4. Token Integration

- [ ] Real stable tokens (USDC, USDT)
- [ ] Real collateral tokens (ETH, FLOW)
- [ ] Proper token decimals
- [ ] Liquidity considerations

## 🔧 Troubleshooting

### Common Issues

1. **Circuit Compilation Fails**
   ```bash
   # Check Circom installation
   circom --version
   
   # Reinstall if needed
   npm install -g circom
   ```

2. **Proof Generation Fails**
   ```bash
   # Check input format
   cat circuits/input.json
   
   # Verify circuit compilation
   npm run circuit:compile
   ```

3. **Deployment Fails**
   ```bash
   # Check network connection
   # Verify private key
   # Check gas prices
   ```

4. **Verification Fails**
   ```bash
   # Check proof format
   # Verify public signals
   # Check verifier contract
   ```

### Debug Commands

```bash
# Check circuit status
ls -la circuits/build/

# Verify proof locally
snarkjs groth16 verify circuits/build/verification_key.json circuits/public.json circuits/proof.json

# Check contract deployment
cat deployment-info.json

# Test contract interaction
npx hardhat console --network flowtestnet
```

## 📞 Support

For deployment issues:

1. Check the troubleshooting section
2. Review contract logs
3. Verify circuit setup
4. Check network connectivity
5. Create an issue in the repository

## 🔗 Additional Resources

- [Flow EVM Documentation](https://docs.onflow.org/evm/)
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

**⚠️ Disclaimer**: This is a deployment guide for the ZK Lending MVP. Always conduct thorough testing and security audits before deploying to mainnet.
