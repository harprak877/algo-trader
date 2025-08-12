# 🚀 Deployment Guide

This guide will help you deploy your algorithmic trading bot to various platforms.

## 📋 Prerequisites

- GitHub repository (✅ Already done!)
- Python 3.9+ runtime
- Node.js 16+ runtime
- Environment variables configured

## 🌐 Deployment Options

### 1. **Vercel (Recommended for Frontend)**

#### Frontend Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Follow prompts:
# - Set project name: algorithmic-trading-bot
# - Set build command: npm run build
# - Set output directory: dist
# - Set install command: npm install
```

#### Environment Variables (Vercel Dashboard)
```bash
NODE_ENV=production
VITE_API_URL=https://your-backend-url.com
```

### 2. **Railway (Recommended for Backend)**

#### Backend Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Environment Variables (Railway Dashboard)
```bash
ALPACA_API_KEY=your_api_key
ALPACA_SECRET_KEY=your_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
PORT=8000
```

### 3. **Render (Alternative)**

#### Backend Deployment
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python trading_api.py`
4. Add environment variables

### 4. **Heroku (Alternative)**

#### Backend Deployment
```bash
# Install Heroku CLI
# Create Procfile
echo "web: python trading_api.py" > Procfile

# Deploy
heroku create your-trading-bot
git push heroku main
```

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Railway Configuration (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python trading_api.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🌍 Environment Setup

### Production Environment Variables
```bash
# Backend
ALPACA_API_KEY=your_production_api_key
ALPACA_SECRET_KEY=your_production_secret_key
ALPACA_BASE_URL=https://api.alpaca.markets
NODE_ENV=production
PORT=8000

# Frontend
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
NODE_ENV=production
```

### Configuration File (`config.yaml`)
```yaml
alpaca:
  api_key: ${ALPACA_API_KEY}
  secret_key: ${ALPACA_SECRET_KEY}
  base_url: ${ALPACA_BASE_URL}
  paper: false  # Set to false for live trading

strategy:
  short_sma: 20
  long_sma: 50
  symbols: ["AAPL", "TSLA", "SPY"]

risk:
  stop_loss: 0.05
  take_profit: 0.10
  max_position_size: 0.1
```

## 🚀 Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "🚀 Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend
```bash
# Choose your backend platform (Railway recommended)
# Set environment variables
# Deploy and get URL
```

### Step 3: Deploy Frontend
```bash
# Update API URLs in frontend code
# Deploy to Vercel
# Configure environment variables
```

### Step 4: Test Deployment
```bash
# Test API endpoints
curl https://your-backend-url.com/api/trading/sessions

# Test WebSocket connection
# Open browser console and test WebSocket
```

## 🔒 Security Considerations

### Environment Variables
- Never commit API keys to GitHub
- Use platform-specific secret management
- Rotate keys regularly

### API Security
- Implement rate limiting
- Add authentication if needed
- Use HTTPS in production

### Trading Security
- Start with paper trading
- Test thoroughly before live trading
- Monitor performance regularly

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# API Health
curl https://your-backend-url.com/api/status

# Trading Status
curl https://your-backend-url.com/api/trading/sessions
```

### Logs
- Monitor application logs
- Set up error alerts
- Track trading performance

### Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt
npm install

# Redeploy
# (Follow platform-specific redeployment steps)
```

## 🆘 Troubleshooting

### Common Issues

#### Frontend Not Loading
- Check build logs
- Verify environment variables
- Check API endpoint URLs

#### Backend Connection Issues
- Verify environment variables
- Check port configuration
- Test local deployment first

#### WebSocket Connection Failed
- Check CORS settings
- Verify WebSocket URL
- Test with simple WebSocket client

### Debug Commands
```bash
# Check backend logs
railway logs  # or platform-specific command

# Test API locally
python trading_api.py

# Test frontend locally
npm run dev
```

## 🎯 Next Steps

1. **Deploy Backend**: Choose Railway or Render
2. **Deploy Frontend**: Use Vercel
3. **Configure Environment**: Set production variables
4. **Test Deployment**: Verify all functionality works
5. **Monitor Performance**: Set up logging and alerts
6. **Scale Up**: Add more features and optimizations

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check README.md for detailed setup
- **Community**: Join trading bot communities for help

---

**🚀 Happy Deploying!**

Your algorithmic trading bot is now ready for the world! 🌍
