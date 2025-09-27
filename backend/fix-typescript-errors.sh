#!/bin/bash

# TypeScript Error Fixing Script
# Run this to fix common TypeScript errors in the backend

echo "🔧 Starting TypeScript Error Fixes..."

# 1. Install missing type dependencies
echo "📦 Installing missing type packages..."
cd backend
npm install --save-dev @types/node-pg-migrate @types/rate-limit-redis

# 2. Fix logger imports
echo "🔄 Fixing logger imports..."
find src -name "*.ts" -exec sed -i '' 's/import { logger }/import { logInfo, logError }/g' {} \;

# 3. Run TypeScript compiler to check remaining errors
echo "🔍 Checking remaining TypeScript errors..."
npx tsc --noEmit 2>&1 | head -20

echo "✅ Initial fixes applied. Check output above for remaining errors."