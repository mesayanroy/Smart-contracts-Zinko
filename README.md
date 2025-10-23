# ZK Lending MVP for Flow EVM

A Zero-Knowledge lending protocol MVP built for Flow EVM testnet, featuring privacy-preserving collateral verification using Circom circuits and SnarkJS.

## 🚀 Features

- **Zero-Knowledge Proofs**: Private collateral verification without revealing sensitive financial data
- **Flow EVM Compatible**: Deployed on Flow EVM testnet
- **Modular Design**: Separate verifier, oracle, and lending contracts
- **Liquidation System**: Automated liquidation of undercollateralized positions
- **Price Oracle Integration**: Chainlink price feeds for accurate collateral valuation

## 📁 Project Structure

```
zk-lending-mvp/
├── contracts/
│   ├── ZKVerifier.sol          # ZK proof verifier (stub for development)
│   ├── ZKLending.sol           # Main lending contract
│   └── ChainlinkPriceOracle.sol # Price oracle wrapper
├── scripts/
│   └── deploy.js               # Deployment script
├── circuits/
│   ├── collateral_check.circom # Circom circuit for collateral verification
│   ├── input.json             # Sample circuit input
│   ├── generate_proof.js      # Proof generation utility
│   └── build/                 # Circuit compilation artifacts
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd zk-lending-mvp
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Flow EVM Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=https://testnet.evm.nodes.onflow.org

# Token Addresses (deploy or find existing tokens on Flow EVM testnet)
STABLE_TOKEN=0x...
COLLATERAL_TOKEN=0x...

# Chainlink Price Feed (if available)
CHAINLINK_FEED=0x...

# Other configurations...
```

### 3. Get Flow EVM Testnet Tokens

1. Visit [Flow EVM Testnet Faucet](https://testnet.evm.nodes.onflow.org)
2. Get testnet FLOWT tokens for gas fees
3. Deploy or find existing ERC20 token contracts for stable and collateral tokens

## 🔧 Development

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Local Development

```bash
# Start local Hardhat node
npm run node

# Deploy to local network
npm run deploy:local
```

## 🚀 Deployment

### Deploy to Flow EVM Testnet

```bash
npm run deploy:testnet
```

### Deploy to Flow EVM Mainnet

```bash
# Update hardhat.config.js for mainnet
npm run deploy:mainnet
```

## 🔐 Zero-Knowledge Circuit Setup

### Quick Setup (Recommended)

```bash
# Complete circuit setup in one command
npm run circuit:full-setup

# Test the full flow (setup + proof generation)
npm run circuit:test
```

### Manual Setup (Step by Step)

#### 1. Install Dependencies

```bash
# Install Circom and SnarkJS globally
npm install -g circom snarkjs

# Or install locally (already in package.json)
npm install
```

#### 2. Compile Circuit

```bash
npm run circuit:compile
```

This generates:
- `circuits/build/collateral_check.r1cs` - R1CS constraint system
- `circuits/build/collateral_check.wasm` - WebAssembly witness generator
- `circuits/build/collateral_check_js/` - JavaScript witness generator

#### 3. Trusted Setup (Groth16)

```bash
npm run circuit:setup
```

This performs:
- Groth16 trusted setup ceremony
- Generates `collateral_check_final.zkey`
- Exports verification key

#### 4. Generate Solidity Verifier

```bash
npm run circuit:export-verifier
```

This replaces `contracts/Verifier.sol` with the SnarkJS-generated verifier contract.

#### 5. Generate and Test Proof

```bash
# Update circuits/input.json with your values
npm run circuit:generate-proof
```

This generates:
- `circuits/proof.json` - ZK proof
- `circuits/public.json` - Public signals
- `circuits/witness.wtns` - Witness file

## 📋 Usage

### 1. Deposit Collateral

```javascript
const lending = await ethers.getContractAt("ZKLending", lendingAddress);
await lending.depositCollateral(ethers.utils.parseEther("100"));
```

### 2. Generate ZK Proof

```javascript
// Update circuits/input.json with your values
const { generateProof } = require("./circuits/generate_proof");
const { proof, publicSignals } = await generateProof();
```

### 3. Borrow with ZK Proof (SnarkJS Format)

```javascript
// Format proof for SnarkJS verifier
const a = [proof.pi_a[0], proof.pi_a[1]];
const b = [
  [proof.pi_b[0][0], proof.pi_b[0][1]],
  [proof.pi_b[1][0], proof.pi_b[1][1]]
];
const c = [proof.pi_c[0], proof.pi_c[1]];

await lending.borrow(
  ethers.utils.parseEther("50"),
  a,
  b,
  c,
  publicSignals
);
```

### 4. Frontend Integration

```javascript
const { ZKLendingClient } = require("./examples/frontend-integration");

// Setup client
const client = new ZKLendingClient(provider, lendingAddress, verifierAddress);

// Generate proof and borrow
const proofData = await client.generateBorrowProof({
  userAddress: wallet.address,
  collateralAmount: ethers.utils.parseEther("100").toString(),
  collateralPrice: ethers.utils.parseEther("2000").toString(),
  borrowAmount: ethers.utils.parseEther("50").toString(),
  collateralizationRatio: "150"
});

await client.borrow(ethers.utils.parseEther("50"), proofData);
```

### 5. Repay Loan

```javascript
await lending.repay(ethers.utils.parseEther("50"));
```

### 6. Withdraw Collateral

```javascript
await lending.withdrawCollateral(ethers.utils.parseEther("50"));
```

## 🔍 Circuit Logic

The `collateral_check.circom` circuit verifies:

1. **Collateral Value Calculation**: `collateralValue = collateralAmount × price`
2. **Maximum Borrowable**: `maxBorrowable = (collateralValue × 100) / collateralizationRatio`
3. **Borrow Check**: `borrowAmount ≤ maxBorrowable`
4. **User Verification**: Proof is tied to specific user address

### Public Signals

- `userAddressHash`: Hash of user address for verification
- `borrowAmountHash`: Hash of requested borrow amount
- `collateralValue`: Total collateral value
- `maxBorrowable`: Maximum amount user can borrow
- `canBorrow`: Boolean indicating if user can borrow

## 🛡️ Security Considerations

### Current Implementation (MVP)

- **ZKVerifier Stub**: Returns `true` for all proofs (development only)
- **Basic Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Simple Price Oracle**: Basic Chainlink integration

### Production Requirements

- **Real ZK Verifier**: Replace stub with generated verifier contract
- **Comprehensive Testing**: Unit tests, integration tests, circuit tests
- **Security Audits**: Professional security audit before mainnet
- **Access Controls**: Proper role-based access control
- **Upgradeability**: Consider proxy patterns for contract upgrades

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Circuit Tests

```bash
# Test circuit compilation
npm run circuit:compile

# Test proof generation
npm run circuit:generate-proof
```

### Integration Tests

```bash
# Test full flow with local node
npm run node
npm run deploy:local
# Run integration tests...
```

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:

- **Solidity 0.8.19**: Latest stable version with optimizations
- **Compiler Optimizations**: Enabled with 200 runs
- **Efficient Storage**: Minimal storage operations
- **Batch Operations**: Where possible, operations are batched

## 🔗 Flow EVM Integration

### Network Configuration

- **Testnet**: `https://testnet.evm.nodes.onflow.org` (Chain ID: 545)
- **Mainnet**: `https://mainnet.evm.nodes.onflow.org` (Chain ID: 747)

### Token Requirements

You need to deploy or find existing ERC20 tokens on Flow EVM:

1. **Stable Token**: USDC, USDT, or similar
2. **Collateral Token**: ETH, FLOW, or other volatile assets

### Price Feeds

Check Flow EVM documentation for available Chainlink price feeds. If none are available, implement a custom oracle or use a trusted price relay.

## 🚨 Important Notes

### Development vs Production

- **Verifier Contract**: Replace placeholder with SnarkJS-generated verifier before deployment
- **Mock Price Oracle**: Use real price feeds in production
- **Test Tokens**: Use real tokens on mainnet
- **Security Audits**: Required before mainnet deployment

### SnarkJS Integration

The project now includes complete SnarkJS integration:

1. **Real Verifier**: Generated by `snarkjs zkey export solidityverifier`
2. **Proof Format**: Standard SnarkJS format (a, b, c, publicSignals)
3. **Circuit Compilation**: Automated with `npm run circuit:compile`
4. **Trusted Setup**: Automated with `npm run circuit:setup`
5. **Proof Generation**: Automated with `npm run circuit:generate-proof`

### Circuit Limitations

- **Trusted Setup**: Requires secure ceremony for production
- **Proof Generation**: Can be computationally expensive (seconds to minutes)
- **Verification Gas**: ZK proof verification costs gas (~200k-500k gas)
- **Circuit Size**: Larger circuits = more gas for verification

### Production Deployment Checklist

- [ ] Replace `contracts/Verifier.sol` with SnarkJS-generated verifier
- [ ] Run full circuit setup: `npm run circuit:full-setup`
- [ ] Test proof generation: `npm run circuit:generate-proof`
- [ ] Deploy contracts: `npm run deploy:testnet`
- [ ] Test end-to-end flow with real proofs
- [ ] Security audit before mainnet
- [ ] Use real price oracles and tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Flow EVM Documentation](https://docs.onflow.org/evm/)
- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 📞 Support

For questions and support:

- Create an issue in the repository
- Join the Flow Discord community
- Check the Flow EVM documentation

---

**⚠️ Disclaimer**: This is an MVP implementation for educational purposes. Do not use in production without proper security audits and testing.
