#!/bin/bash

# Civic Issues Tracker - Organization Admin Setup Script
# This script sets up the organization-admin application with proper environment configuration

set -e

echo "🚀 Setting up Organization Admin Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
fi

# Install dependencies
echo -e "\n${BLUE}Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run build
echo -e "\n${BLUE}Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build completed${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure backend is running: cd Backend && python manage.py runserver 0.0.0.0:8000"
echo "2. Start development server: npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Environment configuration:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend: http://localhost:8000/api/v1"
echo ""
echo "For production deployment, update VITE_API_BASE_URL in .env.production"
