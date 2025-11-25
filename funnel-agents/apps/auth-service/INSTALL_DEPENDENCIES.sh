#!/bin/bash

# Auth Service Security Features - Dependency Installation Script

echo "======================================"
echo "Auth Service Security Dependencies"
echo "======================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/../.." || exit 1

echo "Installing required dependencies..."
echo ""

# Check if pnpm is available
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm add helmet nodemailer @nestjs/throttler
    pnpm add -D @types/nodemailer
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install helmet nodemailer @nestjs/throttler
    npm install --save-dev @types/nodemailer
else
    echo "Error: Neither pnpm nor npm found. Please install Node.js and npm/pnpm."
    exit 1
fi

echo ""
echo "======================================"
echo "Dependencies installed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update your .env file with SMTP credentials"
echo "2. Review SECURITY_SETUP.md for configuration"
echo "3. Run database migrations if needed"
echo "4. Test the security features"
echo ""
