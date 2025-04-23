#!/usr/bin/env node

/**
 * Focused test script for marketing analytics functionality in Puppeteer+ MarTech
 * Tests all marketing-related tools across multiple websites with various analytics implementations
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';
import path from 'path';

// Array of test websites with different marketing technology stacks
const TEST_SITES = [
  { 
    name: 'Adobe', 
    url: 'https://www.adobe.com/', 
    expectedTech: ['Adobe Analytics', 'Adobe Launch', 'Adobe Target']
  },
  { 
    name: 'HubSpot', 
    url: 'https://www.hubspot.com/', 
    expectedTech: ['HubSpot Analytics', 'Google Analytics']
  },
  { 
    name: 'Salesforce', 
    url: 'https://www.salesforce.com/', 
    expectedTech: ['Google Tag Manager', 'Google Analytics']
  },
  { 
    name: 'New York Times', 
    url: 'https://www.nytimes.com/', 
    expectedTech: ['advertising pixels']
  }
];

// List of all marketing tools to test
const MARKETING_TOOLS = [
  // Core marketing analysis
  {
    name: 'find-marketing-technologies',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Analytics platforms
  {
    name: 'analyze-analytics-platforms',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Adobe specific
  {
    name: 'detect-adobe-technologies',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Ad pixels
  {
    name: 'detect-ad-pixels',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Tag managers
  {
    name: 'identify-tag-managers',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Beacons and network requests
  {
    name: 'track-marketing-beacons',
    getParams: (site) => ({ url: site.url, waitTime: 5000, maxRequests: 10 })
  },
  // Visualization
  {
    name: 'highlight-marketing-tools',
    getParams: (site) => ({ url: site.url, highlightPixels: true })
  },
  // Comprehensive analysis
  {
    name: 'scan-marketing-stack',
    getParams: (site) => ({ url: site.url, waitTime: 5000 })
  },
  // Advanced visualization
  {
    name: 'visualize-marketing-tech',
    getParams: (site) => ({ url: site.url, highlightMode: "detailed" })
  }
];

// Output directory for test results
const OUTPUT_DIR = './test-results';

// More robust test function with timeout and result saving
async function testTool(client, toolName, params, siteName, timeoutMs = 180000) {
  console.log(`\n🔍 Testing tool: ${toolName} on ${siteName}`);
  
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    // Create the actual tool call promise
    const toolCallPromise = client.callTool({
      name: toolName,
      arguments: params
    });
    
    // Race the promises
    const result = await Promise.race([toolCallPromise, timeoutPromise]);
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultDir = path.join(OUTPUT_DIR, sanitizeFilename(siteName));
    
    // Create directories if they don't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir);
    }
    
    // Handle result based on content type
    if (result.content && result.content.some(item => item.type === 'image')) {
      // For image content, save the image
      const imageContent = result.content.find(item => item.type === 'image');
      const imageFilePath = path.join(resultDir, `${sanitizeFilename(toolName)}-${timestamp}.png`);
      
      if (imageContent.data) {
        fs.writeFileSync(imageFilePath, Buffer.from(imageContent.data, 'base64'));
        console.log(`✅ Success: Image saved to ${imageFilePath}`);
      } else {
        console.log(`✅ Success: Received image content (no data to save)`);
      }
      
      return { success: true, type: 'image', path: imageFilePath };
    } else {
      // For text content, save to JSON file
      const textContent = result.content.find(item => item.type === 'text')?.text;
      const textFilePath = path.join(resultDir, `${sanitizeFilename(toolName)}-${timestamp}.json`);
      
      // Save the full result object
      fs.writeFileSync(textFilePath, JSON.stringify(result, null, 2));
      
      // Print a snippet
      console.log(`✅ Success: ${textContent ? textContent.substring(0, 100) + '...' : 'No text content'}`);
      console.log(`   Full results saved to ${textFilePath}`);
      
      return { success: true, type: 'text', path: textFilePath, content: textContent };
    }
  } catch (error) {
    console.error(`❌ Error testing ${toolName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to sanitize filenames
function sanitizeFilename(input) {
  return input.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

// Function to check if expected technologies were detected
function checkExpectedTech(results, site) {
  console.log(`\n🔍 Analyzing results for ${site.name}...`);
  
  let foundTech = [];
  let detectedAll = true;
  
  // Extract technology names from results
  for (const result of results) {
    if (result.success && result.type === 'text' && result.content) {
      // Try to extract technology names from the content
      const content = result.content.toLowerCase();
      
      site.expectedTech.forEach(tech => {
        if (content.includes(tech.toLowerCase()) && !foundTech.includes(tech)) {
          foundTech.push(tech);
          console.log(`✅ Found expected technology: ${tech}`);
        }
      });
    }
  }
  
  // Check if all expected technologies were found
  site.expectedTech.forEach(tech => {
    if (!foundTech.includes(tech)) {
      detectedAll = false;
      console.log(`❌ Missing expected technology: ${tech}`);
    }
  });
  
  return {
    detectedAll,
    foundTech,
    missingTech: site.expectedTech.filter(tech => !foundTech.includes(tech))
  };
}

// Main test function
async function main() {
  let server;
  let client;
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }
    
    // Start the server process
    console.log("🚀 Starting Puppeteer+ MarTech server...");
    server = spawn('node', ['index.js'], {
      env: {
        ...process.env,
        PUPPETEER_HEADLESS: 'new',
        DEBUG: 'puppeteer:*'
      }
    });
    
    // Handle server output
    server.stderr.on('data', (data) => {
      // Uncomment for verbose server logs
      // console.log(`Server log: ${data}`);
    });
    
    server.on('error', (error) => {
      console.error(`Server process error: ${error.message}`);
      process.exit(1);
    });
    
    // Create MCP client
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['index.js']
    });
    
    client = new Client({
      name: 'martech-test-client',
      version: '1.0.0'
    });
    
    // Connect client to server
    console.log("📡 Connecting to server...");
    client.connect(transport);
    
    // Wait for server initialization
    console.log("⏳ Waiting for server initialization...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      overall: {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0
      },
      siteResults: {}
    };
    
    // Test each site
    for (const site of TEST_SITES) {
      console.log(`\n🌐 Testing site: ${site.name} (${site.url})`);
      
      const siteResults = [];
      let siteSuccessCount = 0;
      let siteFailCount = 0;
      
      // Test each tool on the site
      for (const tool of MARKETING_TOOLS) {
        const params = tool.getParams(site);
        const result = await testTool(client, tool.name, params, site.name);
        
        siteResults.push({
          tool: tool.name,
          ...result
        });
        
        if (result.success) {
          siteSuccessCount++;
        } else {
          siteFailCount++;
        }
        
        // Add a pause between tests
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Check if expected technologies were detected
      const techAnalysis = checkExpectedTech(siteResults, site);
      
      // Add to summary
      summaryReport.overall.totalTests += MARKETING_TOOLS.length;
      summaryReport.overall.successfulTests += siteSuccessCount;
      summaryReport.overall.failedTests += siteFailCount;
      
      summaryReport.siteResults[site.name] = {
        url: site.url,
        testsRun: MARKETING_TOOLS.length,
        successfulTests: siteSuccessCount,
        failedTests: siteFailCount,
        expectedTech: site.expectedTech,
        foundTech: techAnalysis.foundTech,
        missingTech: techAnalysis.missingTech,
        detectedAllExpected: techAnalysis.detectedAll
      };
      
      console.log(`\n📊 Site summary for ${site.name}:`);
      console.log(`   Tests run: ${MARKETING_TOOLS.length}`);
      console.log(`   Successful: ${siteSuccessCount}`);
      console.log(`   Failed: ${siteFailCount}`);
      console.log(`   Expected tech detected: ${techAnalysis.detectedAll ? 'All' : techAnalysis.foundTech.length + '/' + site.expectedTech.length}`);
    }
    
    // Save summary report
    const reportPath = path.join(OUTPUT_DIR, `marketing-test-summary-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2));
    
    // Generate overall summary
    console.log("\n\n📋 OVERALL TEST SUMMARY:");
    console.log(`🔢 Total tests run: ${summaryReport.overall.totalTests}`);
    console.log(`✅ Successful tests: ${summaryReport.overall.successfulTests}`);
    console.log(`❌ Failed tests: ${summaryReport.overall.failedTests}`);
    console.log(`📈 Success rate: ${Math.round((summaryReport.overall.successfulTests / summaryReport.overall.totalTests) * 100)}%`);
    
    // Check for sites where all expected tech was detected
    const sitesWithAllTech = Object.values(summaryReport.siteResults).filter(site => site.detectedAllExpected).length;
    const totalSites = TEST_SITES.length;
    
    console.log(`🎯 Sites with all expected tech detected: ${sitesWithAllTech}/${totalSites}`);
    console.log(`📄 Detailed summary report saved to: ${reportPath}`);
    
    // Final recommendation
    const overallSuccess = summaryReport.overall.successfulTests / summaryReport.overall.totalTests;
    const techDetectionSuccess = sitesWithAllTech / totalSites;
    
    if (overallSuccess >= 0.9 && techDetectionSuccess >= 0.75) {
      console.log("\n🚀 RECOMMENDATION: Package is READY for npm publishing!");
    } else if (overallSuccess >= 0.8 && techDetectionSuccess >= 0.5) {
      console.log("\n🟡 RECOMMENDATION: Package is MOSTLY READY, but some improvements could be made before publishing.");
    } else {
      console.log("\n🔴 RECOMMENDATION: Package needs MORE WORK before publishing.");
    }
    
  } catch (error) {
    console.error("❌ Critical error during testing:", error);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.error("Error closing client:", e);
      }
    }
    
    if (server) {
      server.kill();
    }
    
    console.log("✨ Test complete!");
  }
}

// Run the main function with proper error handling
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});