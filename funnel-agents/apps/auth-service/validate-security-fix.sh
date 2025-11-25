#!/bin/bash

# Validation script for JWT security fix
# This script verifies that all hardcoded JWT secrets have been removed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  JWT Security Fix Validation"
echo "=========================================="
echo ""

ISSUES_FOUND=0

# Check 1: Scan for hardcoded secrets in source code
echo -n "Checking for hardcoded secrets in source code... "
if grep -r "your-secret-key\|your-refresh-secret-key" src/ 2>/dev/null; then
    echo -e "${RED}FAIL${NC}"
    echo "  Found hardcoded secrets in source code!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}PASS${NC}"
fi

# Check 2: Scan for dangerous fallback patterns
echo -n "Checking for dangerous fallback patterns... "
if grep -r "JWT_SECRET.*||.*['\"]" src/ 2>/dev/null | grep -v "//"; then
    echo -e "${RED}FAIL${NC}"
    echo "  Found dangerous fallback pattern!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}PASS${NC}"
fi

# Check 3: Verify startup validation exists
echo -n "Checking for startup validation in main.ts... "
if grep -q "FATAL SECURITY ERROR" src/main.ts; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Startup validation not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 4: Verify auth.module.ts has validation
echo -n "Checking for validation in auth.module.ts... "
if grep -q "JWT_SECRET environment variable is required" src/auth.module.ts; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Module validation not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 5: Verify jwt.strategy.ts has validation
echo -n "Checking for validation in jwt.strategy.ts... "
if grep -q "JWT_SECRET environment variable is required" src/strategies/jwt.strategy.ts; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Strategy validation not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 6: Verify auth.service.ts has runtime validation
echo -n "Checking for runtime validation in auth.service.ts... "
if grep -q "JWT configuration error" src/auth.service.ts; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  Runtime validation not found!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 7: Verify .env.example has security warnings
echo -n "Checking for security warnings in .env.example... "
if grep -q "SECURITY WARNING" .env.example; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${YELLOW}WARN${NC}"
    echo "  Security warnings not found in .env.example"
fi

# Check 8: Verify weak example values are removed
echo -n "Checking for weak example values... "
if grep -E "JWT_SECRET=.*(your-|change|test|example)" .env.example 2>/dev/null | grep -v "REPLACE_WITH"; then
    echo -e "${RED}FAIL${NC}"
    echo "  Weak example values found in .env.example!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}PASS${NC}"
fi

# Check 9: TypeScript compilation
echo -n "Running TypeScript compilation check... "
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "  TypeScript compilation failed!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "=========================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}All validation checks passed!${NC}"
    echo "=========================================="
    echo ""
    echo "Security fix is properly implemented."
    echo ""
    exit 0
else
    echo -e "${RED}Found $ISSUES_FOUND issue(s)!${NC}"
    echo "=========================================="
    echo ""
    echo "Please fix the issues above before deploying."
    echo ""
    exit 1
fi
