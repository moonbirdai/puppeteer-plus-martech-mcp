#!/bin/bash
# Script to make the test scripts executable and run them

# Make the test scripts executable
chmod +x test-publish.sh
chmod +x test-marketing.js
chmod +x test-local-fixed.js

echo "Made test scripts executable"

# Run the fixed local test script
echo "Running the test script with corrected tool names..."
node test-local-fixed.js

# If test passes, offer to publish
if [ $? -eq 0 ]; then
  echo "✅ Tests passed! Ready to publish to npm."
  echo "To publish your package, run:"
  echo "npm publish"
  echo ""
  echo "Your package will be published as: @modelcontextprotocol/server-puppeteer-plus-martech"
  echo "Stylized as: Puppeteer+ MarTech"
else
  echo "❌ Some tests failed. Please fix the issues before publishing."
fi
