#!/bin/bash
# Script to verify all name changes have been made correctly

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   VERIFYING PUPPETEER+ MARTECH NAMING   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check package.json name
if [[ $(grep -c "\"name\": \"puppeteer-plus-martech\"" package.json) -eq 1 ]]; then
  echo -e "${GREEN}✓ package.json name is correct${NC}"
else
  echo -e "${RED}✗ package.json name is incorrect${NC}"
  echo -e "${YELLOW}Expected: \"name\": \"puppeteer-plus-martech\"${NC}"
fi

# Check package.json bin
if [[ $(grep -c "\"puppeteer-plus-martech\":" package.json) -eq 1 ]]; then
  echo -e "${GREEN}✓ package.json bin command is correct${NC}"
else
  echo -e "${RED}✗ package.json bin command is incorrect${NC}"
  echo -e "${YELLOW}Expected: \"puppeteer-plus-martech\": \"index.js\"${NC}"
fi

# Check server name in index.js
if [[ $(grep -c "name: \"puppeteer-plus-martech\"" index.js) -eq 1 ]]; then
  echo -e "${GREEN}✓ Server name in index.js is correct${NC}"
else
  echo -e "${RED}✗ Server name in index.js is incorrect${NC}"
  echo -e "${YELLOW}Expected: name: \"puppeteer-plus-martech\"${NC}"
fi

# Check installation instructions in README.md
if [[ $(grep -c "npm install puppeteer-plus-martech" README.md) -eq 1 ]]; then
  echo -e "${GREEN}✓ Installation instructions in README.md are correct${NC}"
else
  echo -e "${RED}✗ Installation instructions in README.md are incorrect${NC}"
  echo -e "${YELLOW}Expected: npm install puppeteer-plus-martech${NC}"
fi

# Check usage instructions in README.md
if [[ $(grep -c "npx puppeteer-plus-martech" README.md) -eq 1 ]]; then
  echo -e "${GREEN}✓ Usage instructions in README.md are correct${NC}"
else
  echo -e "${RED}✗ Usage instructions in README.md are incorrect${NC}"
  echo -e "${YELLOW}Expected: npx puppeteer-plus-martech${NC}"
fi

# Check Claude Desktop config in README.md
if [[ $(grep -c "\"puppeteer-plus-martech\"" README.md) -ge 1 ]]; then
  echo -e "${GREEN}✓ Claude Desktop config in README.md is correct${NC}"
else
  echo -e "${RED}✗ Claude Desktop config in README.md is incorrect${NC}"
  echo -e "${YELLOW}Expected references to puppeteer-plus-martech in Claude config${NC}"
fi

echo -e "\n${BLUE}Verification Complete${NC}"
echo -e "${YELLOW}If all checks pass, you can run:${NC}"
echo -e "${BLUE}bash publish-unscoped.sh${NC}"
echo -e "${YELLOW}to publish your package to npm.${NC}"
