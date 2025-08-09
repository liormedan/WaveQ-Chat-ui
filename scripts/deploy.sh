#!/bin/bash

# 🚀 Vercel Deployment Script
# This script helps prepare and deploy the application to Vercel

set -e

echo "🚀 Starting Vercel deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Please install pnpm first."
    echo "   npm install -g pnpm"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the project
echo "🔨 Building the project..."
pnpm build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating example file..."
    cat > .env.local << EOF
# AI Provider Configuration
XAI_API_KEY=your-xai-api-key-here

# Authentication Configuration
AUTH_SECRET=your-auth-secret-here

# Database Configuration (for production)
# POSTGRES_URL=postgresql://user:password@host:port/database

# Application Configuration
NODE_ENV=production
npm_package_version=3.1.0
EOF
    echo "📝 Created .env.local.example. Please update it with your actual values."
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "⚠️  vercel.json not found. Creating..."
    cat > vercel.json << EOF
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/(chat)/api/chat/[id]/stream/route.ts": {
      "maxDuration": 300
    },
    "app/(chat)/api/audio/generate/route.ts": {
      "maxDuration": 300
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
    echo "✅ Created vercel.json"
fi

echo ""
echo "🎯 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual API keys"
echo "2. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for production deployment'"
echo "   git push origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   - Option A: Use Vercel Dashboard (recommended)"
echo "     https://vercel.com/dashboard"
echo "   - Option B: Use Vercel CLI:"
echo "     vercel --prod"
echo ""
echo "4. Set environment variables in Vercel Dashboard:"
echo "   - XAI_API_KEY"
echo "   - AUTH_SECRET"
echo "   - POSTGRES_URL (if using PostgreSQL)"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
