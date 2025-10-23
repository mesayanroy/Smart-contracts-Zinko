#!/bin/bash

echo "🚀 Setting up ZK Lending MVP for Flow EVM..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install global dependencies for ZK circuits
echo "🔐 Installing ZK circuit dependencies..."
npm install -g circom snarkjs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before proceeding"
fi

# Create circuits build directory
echo "📁 Creating circuit build directory..."
mkdir -p circuits/build

# Download Powers of Tau file (required for trusted setup)
echo "⬇️  Downloading Powers of Tau file..."
if [ ! -f pot12_final.ptau ]; then
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final.ptau -O pot12_final.ptau
    echo "✅ Powers of Tau file downloaded"
else
    echo "✅ Powers of Tau file already exists"
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Get Flow EVM testnet tokens from the faucet"
echo "3. Deploy contracts: npm run deploy:testnet"
echo "4. Compile circuits: npm run circuit:compile"
echo "5. Generate proofs: npm run circuit:generate-proof"
echo ""
echo "For more information, see README.md"
