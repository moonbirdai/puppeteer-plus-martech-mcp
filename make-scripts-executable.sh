#!/bin/bash
# Simple script to make the test scripts executable

# Make the comprehensive test script executable
chmod +x test-publish.sh
echo "Made test-publish.sh executable"

# Make the marketing test script executable (not strictly necessary for .js files)
chmod +x test-marketing.js
echo "Made test-marketing.js executable"

echo "All test scripts are now ready to use!"
echo ""
echo "Run the test scripts with these commands:"
echo "  ./test-publish.sh       - For comprehensive pre-publish testing"
echo "  node test-marketing.js  - For focused marketing technology testing"
