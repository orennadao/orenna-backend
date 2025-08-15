#!/bin/bash

echo "🔧 Fixing Foundry dependencies..."

# Remove existing lib directory if it exists
if [ -d "lib" ]; then
    echo "📁 Removing existing lib directory..."
    rm -rf lib
fi

# Install forge-std first
echo "📦 Installing forge-std..."
forge install foundry-rs/forge-std --no-commit

# Install OpenZeppelin contracts
echo "📦 Installing OpenZeppelin contracts..."
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Verify installations
echo "✅ Checking installations..."
if [ -f "lib/forge-std/src/Test.sol" ]; then
    echo "✓ forge-std installed correctly"
else
    echo "❌ forge-std installation failed"
fi

if [ -f "lib/openzeppelin-contracts/contracts/access/AccessControl.sol" ]; then
    echo "✓ OpenZeppelin contracts installed correctly"
else
    echo "❌ OpenZeppelin contracts installation failed"
fi

# Update remappings.txt to be more explicit
echo "🔗 Updating remappings..."
cat > remappings.txt << 'EOF'
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/=lib/openzeppelin-contracts/
forge-std/=lib/forge-std/src/
ds-test/=lib/ds-test/src/
src/=src/
EOF

echo "🏗️  Testing compilation..."
forge build

if [ $? -eq 0 ]; then
    echo "✅ Dependencies fixed! Compilation successful."
else
    echo "❌ Still having issues. Let's try manual installation..."
    
    # Manual fallback
    mkdir -p lib
    cd lib
    
    echo "📥 Cloning repositories manually..."
    git clone https://github.com/foundry-rs/forge-std.git
    git clone https://github.com/OpenZeppelin/openzeppelin-contracts.git
    
    cd ..
    echo "🔧 Trying build again..."
    forge build
fi