#!/bin/bash

# Generate secure JWT secrets for auth-service
# Usage: ./generate-secrets.sh

set -e

echo ""
echo "=========================================="
echo "  JWT Secret Generator"
echo "=========================================="
echo ""
echo "Generating cryptographically secure random secrets..."
echo ""

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "Generated secrets (copy these to your .env file):"
echo ""
echo "# JWT Configuration"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "=========================================="
echo ""
echo "SECURITY REMINDERS:"
echo "  1. NEVER commit these secrets to version control"
echo "  2. Use different secrets for different environments"
echo "  3. Store production secrets in a secure vault"
echo "  4. Rotate secrets periodically"
echo "  5. Each secret should be unique (don't reuse)"
echo ""
echo "To apply these secrets:"
echo "  1. Copy the lines above to your .env file"
echo "  2. Restart the auth-service"
echo ""
