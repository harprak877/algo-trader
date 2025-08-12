#!/bin/bash

# 🚀 Algorithmic Trading Bot Deployment Script
# This script helps you deploy your trading bot to various platforms

set -e

echo "🚀 Algorithmic Trading Bot Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install git first."
        exit 1
    fi
    
    # Check if node is available
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Frontend deployment may fail."
    fi
    
    # Check if python is available
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Deploy to Vercel
deploy_vercel() {
    print_info "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_info "Starting Vercel deployment..."
    vercel --prod
    
    print_status "Frontend deployment completed!"
}

# Deploy to Railway
deploy_railway() {
    print_info "Deploying backend to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_info "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_info "Starting Railway deployment..."
    railway login
    railway init
    railway up
    
    print_status "Backend deployment completed!"
}

# Deploy to Render
deploy_render() {
    print_info "Deploying to Render..."
    print_warning "Render deployment requires manual setup:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Set build command: pip install -r requirements.txt"
    echo "4. Set start command: python trading_api.py"
    echo "5. Add environment variables"
    echo "6. Deploy"
}

# Deploy to Heroku
deploy_heroku() {
    print_info "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_info "Installing Heroku CLI..."
        print_warning "Please install Heroku CLI manually from https://devcenter.heroku.com/articles/heroku-cli"
        return
    fi
    
    # Create Procfile if it doesn't exist
    if [ ! -f "Procfile" ]; then
        echo "web: python trading_api.py" > Procfile
        print_info "Created Procfile"
    fi
    
    print_info "Starting Heroku deployment..."
    heroku create
    git push heroku main
    
    print_status "Heroku deployment completed!"
}

# Build project
build_project() {
    print_info "Building project..."
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_info "Installing Node.js dependencies..."
    npm install
    
    # Build frontend
    print_info "Building frontend..."
    npm run build
    
    print_status "Project build completed!"
}

# Test deployment
test_deployment() {
    print_info "Testing deployment..."
    
    # Test backend
    if [ -n "$BACKEND_URL" ]; then
        print_info "Testing backend at $BACKEND_URL"
        curl -s "$BACKEND_URL/api/trading/sessions" | jq '.' || print_warning "Backend test failed"
    fi
    
    # Test frontend
    if [ -n "$FRONTEND_URL" ]; then
        print_info "Testing frontend at $FRONTEND_URL"
        curl -s "$FRONTEND_URL" | grep -q "Live Trading Dashboard" && print_status "Frontend is accessible" || print_warning "Frontend test failed"
    fi
    
    print_status "Deployment testing completed!"
}

# Main deployment function
main() {
    echo ""
    print_info "Choose deployment option:"
    echo "1) Deploy Frontend to Vercel"
    echo "2) Deploy Backend to Railway"
    echo "3) Deploy Backend to Render"
    echo "4) Deploy Backend to Heroku"
    echo "5) Build Project Only"
    echo "6) Test Deployment"
    echo "7) Full Deployment (Vercel + Railway)"
    echo "8) Exit"
    echo ""
    
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_render
            ;;
        4)
            deploy_heroku
            ;;
        5)
            build_project
            ;;
        6)
            read -p "Enter backend URL: " BACKEND_URL
            read -p "Enter frontend URL: " FRONTEND_URL
            test_deployment
            ;;
        7)
            print_info "Starting full deployment..."
            build_project
            deploy_vercel
            deploy_railway
            print_status "Full deployment completed!"
            ;;
        8)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            main
            ;;
    esac
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_prerequisites
    main
fi
