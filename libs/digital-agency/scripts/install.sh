#!/bin/bash
# Installation script for Digital Agency Platform
# Works on Linux, Mac, and Windows (Git Bash)

set -e

echo "🚀 Digital Agency Platform - Installation Script"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo "🐍 Checking Python version..."
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "   Found Python $PYTHON_VERSION"

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✅ uv is already installed${NC}"
    UV_VERSION=$(uv --version | awk '{print $2}')
    echo "   Version: $UV_VERSION"
else
    echo -e "${YELLOW}⚠️  uv not found. Installing uv...${NC}"

    # Install uv
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        pip install uv
    else
        # Linux/Mac
        curl -LsSf https://astral.sh/uv/install.sh | sh
    fi

    echo -e "${GREEN}✅ uv installed successfully${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
uv pip install -r requirements.txt

echo ""
echo "📦 Installing development dependencies..."
uv pip install -r requirements-dev.txt

# Create .env file if it doesn't exist
echo ""
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your API keys${NC}"
else
    echo "✓ .env file already exists"
fi

# Summary
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your API keys"
echo "  2. Start services:"
echo ""
if command -v make &> /dev/null; then
    echo "     ${BLUE}make quick-start${NC}    # Start everything with Docker"
    echo "     ${BLUE}make dev${NC}            # Start dev server only"
else
    echo "     ${BLUE}./make.bat quick-start${NC}  # Windows"
    echo "     ${BLUE}docker-compose up -d${NC}    # Docker"
fi
echo ""
