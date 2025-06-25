#!/bin/bash

echo "🔧 Fixing EventNFT dependencies..."

# Remove existing node_modules and package-lock.json
echo "📦 Cleaning up existing dependencies..."
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Install root dependencies
echo "📥 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📱 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Dependencies fixed! Now you can run:"
echo "   npx hardhat node          # Terminal 1"
echo "   npm run deploy:local      # Terminal 2"
echo "   npm run frontend          # Terminal 3" 