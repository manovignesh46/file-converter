#!/bin/bash

echo "🔧 Optimizing project for Vercel deployment..."

# Clean existing builds
echo "📦 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📚 Reinstalling dependencies..."
npm install --legacy-peer-deps

# Check for circular dependencies
echo "🔍 Checking for circular dependencies..."
npx madge --circular --extensions ts,tsx,js,jsx .

# Build locally to test
echo "🏗️ Testing local build..."
npm run build

echo "✅ Optimization complete! Ready for Vercel deployment."
