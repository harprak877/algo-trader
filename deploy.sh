#!/bin/bash

echo "🚀 Deploying Trading Bot to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to set your environment variables in the Vercel dashboard:"
echo "   - ALPACA_API_KEY"
echo "   - ALPACA_SECRET_KEY"
echo "   - PYTHONPATH=."
