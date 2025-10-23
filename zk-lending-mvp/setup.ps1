# PowerShell setup script for ZK Lending MVP

Write-Host "🚀 Setting up ZK Lending MVP for Flow EVM..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 16) {
    Write-Host "❌ Node.js version $nodeVersion is too old. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Install global dependencies for ZK circuits
Write-Host "🔐 Installing ZK circuit dependencies..." -ForegroundColor Yellow
npm install -g circom snarkjs

# Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "⚠️  Please edit .env file with your configuration before proceeding" -ForegroundColor Yellow
}

# Create circuits build directory
Write-Host "📁 Creating circuit build directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "circuits/build" -Force | Out-Null

# Download Powers of Tau file (required for trusted setup)
Write-Host "⬇️  Downloading Powers of Tau file..." -ForegroundColor Yellow
if (!(Test-Path "pot12_final.ptau")) {
    try {
        Invoke-WebRequest -Uri "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final.ptau" -OutFile "pot12_final.ptau"
        Write-Host "✅ Powers of Tau file downloaded" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download Powers of Tau file. Please download manually." -ForegroundColor Red
    }
} else {
    Write-Host "✅ Powers of Tau file already exists" -ForegroundColor Green
}

# Compile contracts
Write-Host "🔨 Compiling contracts..." -ForegroundColor Yellow
npm run compile

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Get Flow EVM testnet tokens from the faucet" -ForegroundColor White
Write-Host "3. Deploy contracts: npm run deploy:testnet" -ForegroundColor White
Write-Host "4. Compile circuits: npm run circuit:compile" -ForegroundColor White
Write-Host "5. Generate proofs: npm run circuit:generate-proof" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
