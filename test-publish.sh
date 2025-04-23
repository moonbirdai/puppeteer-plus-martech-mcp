#!/bin/bash
# Comprehensive test script for puppeteer-plus-martech MCP

set -e  # Exit on any error

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test URLs - using popular sites with various marketing technologies
TEST_URLS=(
  "https://www.hubspot.com"
  "https://www.nytimes.com"
  "https://www.salesforce.com"
)

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  PUPPETEER+ MARTECH PRE-PUBLISH TEST   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Step 1: Verify package.json
echo -e "\n${YELLOW}Checking package.json...${NC}"
if [[ $(grep -c "\"name\": \"puppeteer-plus-martech\"" package.json) -eq 0 ]]; then
  echo -e "${RED}ERROR: Package name not set correctly in package.json${NC}"
  exit 1
fi

# Make sure author name is updated from default
if grep -q "\"author\": \"Your Name\"" package.json; then
  echo -e "${YELLOW}WARNING: Update author name in package.json before publishing${NC}"
fi

# Make sure GitHub URLs are updated
if grep -q "yourusername" package.json; then
  echo -e "${YELLOW}WARNING: Update GitHub URLs in package.json before publishing${NC}"
fi

echo -e "${GREEN}✓ package.json checks passed${NC}"

# Step 2: Check dependencies
echo -e "\n${YELLOW}Checking dependencies...${NC}"
npm ls --depth=0 @modelcontextprotocol/sdk puppeteer zod
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}WARNING: Some dependencies may be missing. Running npm install...${NC}"
  npm install
fi
echo -e "${GREEN}✓ Dependencies check passed${NC}"

# Step 3: Lint check (if available)
echo -e "\n${YELLOW}Checking code format...${NC}"
if command -v eslint &> /dev/null; then
  eslint --no-eslintrc --config=standard index.js src/
  if [ $? -ne 0 ]; then
    echo -e "${YELLOW}WARNING: ESLint found issues. Consider fixing before publishing.${NC}"
  else
    echo -e "${GREEN}✓ ESLint check passed${NC}"
  fi
else
  echo -e "${YELLOW}ESLint not installed. Skipping code format check.${NC}"
fi

# Step 4: Run provider tests
echo -e "\n${YELLOW}Running provider detection tests...${NC}"
node test-providers.js
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Provider tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Provider tests passed${NC}"

# Step 5: Run live site test with providers
echo -e "\n${YELLOW}Testing live provider detection...${NC}"
node test-providers.js --live https://www.adobe.com
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Live provider detection failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Live provider detection passed${NC}"

# Step 6: Start server and run basic local tests
echo -e "\n${YELLOW}Running core functionality tests...${NC}"
node test-local-fixed.js
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: Core functionality tests failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Core functionality tests passed${NC}"

# Step 7: Test npm pack to verify what gets published
echo -e "\n${YELLOW}Testing npm pack to verify package contents...${NC}"
npm pack --dry-run
if [ $? -ne 0 ]; then
  echo -e "${RED}ERROR: npm pack test failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm pack test passed${NC}"

# Step 8: Test global installation (optional if on development machine)
echo -e "\n${YELLOW}Would you like to test global installation? (y/n)${NC}"
read -r TEST_GLOBAL

if [[ $TEST_GLOBAL == "y" ]]; then
  echo -e "${YELLOW}Testing global installation...${NC}"
  npm install -g .
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Global installation failed${NC}"
    exit 1
  fi
  
  # Test the global command
  puppeteer-plus-martech --version
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Global command execution failed${NC}"
    npm uninstall -g puppeteer-plus-martech
    exit 1
  fi
  
  # Uninstall global version
  npm uninstall -g puppeteer-plus-martech
  echo -e "${GREEN}✓ Global installation test passed${NC}"
else
  echo -e "${YELLOW}Skipping global installation test${NC}"
fi

# Step 9: Final checks and publish confirmation
echo -e "\n${GREEN}==============================================${NC}"
echo -e "${GREEN}All tests passed! Ready to publish to npm.${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "\n${YELLOW}Final checklist before publishing:${NC}"
echo -e "1. Updated package.json with correct author and URLs"
echo -e "2. Verified README.md contains accurate information"
echo -e "3. Double-checked semantic version number"
echo -e "4. Ensured all new features are documented"

echo -e "\n${YELLOW}Current version:${NC} $(grep -o '\"version\": \"[^\"]*\"' package.json | cut -d '\"' -f 4)"
echo -e "\n${YELLOW}Would you like to publish to npm now? (y/n)${NC}"
read -r PUBLISH

if [[ $PUBLISH == "y" ]]; then
  echo -e "${YELLOW}Publishing to npm...${NC}"
  npm publish
  if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Publishing failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Successfully published to npm!${NC}"
else
  echo -e "${YELLOW}Skipping npm publish. Run 'npm publish' manually when ready.${NC}"
fi

echo -e "\n${BLUE}Test script completed.${NC}"