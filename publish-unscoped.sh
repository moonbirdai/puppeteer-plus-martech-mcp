#!/bin/bash
# Script to publish the package with an unscoped name to npm

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}      PUBLISHING PUPPETEER+ MARTECH      ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Verify package.json name
if [[ $(grep -c "\"name\": \"puppeteer-plus-martech\"" package.json) -eq 0 ]]; then
  echo -e "${RED}ERROR: Package name not set correctly in package.json${NC}"
  echo -e "${YELLOW}Expected: \"name\": \"puppeteer-plus-martech\"${NC}"
  exit 1
fi

# Verify the binary name
if [[ $(grep -c "\"puppeteer-plus-martech\": \"index.js\"" package.json) -eq 0 ]]; then
  echo -e "${RED}ERROR: Binary name not set correctly in package.json${NC}"
  echo -e "${YELLOW}Expected: \"puppeteer-plus-martech\": \"index.js\"${NC}"
  exit 1
fi

# Pack the package (dry run)
echo -e "\n${YELLOW}Testing npm pack...${NC}"
npm pack --dry-run
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: npm pack failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Package looks good${NC}"

# Publish confirmation
echo -e "\n${YELLOW}Ready to publish 'puppeteer-plus-martech' to npm${NC}"
echo -e "${YELLOW}This package will be publicly available as: puppeteer-plus-martech${NC}"
echo -e "${YELLOW}Stylized as: Puppeteer+ MarTech${NC}"
echo -e "\n${YELLOW}Do you want to publish to npm now? (y/n)${NC}"
read -r PUBLISH

if [[ $PUBLISH == "y" ]]; then
  # Publish to npm
  echo -e "\n${YELLOW}Publishing to npm...${NC}"
  npm publish
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully published to npm!${NC}"
    echo -e "\n${GREEN}Your package is now available at:${NC}"
    echo -e "${BLUE}https://www.npmjs.com/package/puppeteer-plus-martech${NC}"
    echo -e "\n${GREEN}Users can install it with:${NC}"
    echo -e "${BLUE}npm install puppeteer-plus-martech${NC}"
    echo -e "\n${GREEN}And use it with:${NC}"
    echo -e "${BLUE}npx puppeteer-plus-martech${NC}"
  else
    echo -e "${RED}❌ Publishing failed. Check the error message above.${NC}"
  fi
else
  echo -e "${YELLOW}Publishing canceled.${NC}"
fi

echo -e "\n${BLUE}Script completed.${NC}"
