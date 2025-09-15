#!/bin/bash

echo "🚀 Starting IrtzaLink deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Install dependencies for web panel
echo "📦 Installing web panel dependencies..."
cd web_panel && npm install && cd ..

# Build the project
echo "🔨 Building web panel..."
cd web_panel && npm run build && cd ..

# Deploy to Vercel
echo "🚢 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete! Check your Vercel dashboard for the live URL."