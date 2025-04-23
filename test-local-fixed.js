#!/usr/bin/env node

/**
 * Enhanced test script for Puppeteer+ MarTech MCP Server
 * Tests tools with better error handling and timeout management
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Test website to analyze - use a site with marketing technologies
const TEST_URL = 'https://blog.hubspot.com/';

// More robust test function with timeout
async function testTool(client, toolName, params, timeoutMs = 120000) {
  console.log(`\n=== Testing tool: ${toolName} ===`);
  
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
    
    // Handle result based on content type
    if (result.content && result.content.some(item => item.type === 'image')) {
      console.log(`✅ Success: Received image content`);
      return true;
    } else {
      // For text content, log a snippet
      const textContent = result.content.find(item => item.type === 'text')?.text;
      console.log(`✅ Success: ${textContent ? textContent.substring(0, 100) + '...' : 'No text content'}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error testing ${toolName}:`, error.message);
    return false;
  }
}

async function main() {
  let server;
  let client;
  
  try {
    // Start the server process with environment variables for debugging
    server = spawn('node', ['index.js'], {
      env: {
        ...process.env,
        PUPPETEER_HEADLESS: 'new',
        DEBUG: 'puppeteer:*'
      }
    });
    
    // Handle server output for better debugging
    server.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.log(`Server log: ${data}`);
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
      name: 'test-client',
      version: '1.0.0'
    });
    
    // Connect client to server
    console.log("Connecting to server...");
    client.connect(transport);
    
    // Wait for server initialization
    console.log("Waiting for server initialization...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // List available tools
    console.log("Listing available tools...");
    let tools;
    try {
      tools = await client.listTools();
      console.log(`Found ${tools.tools.length} tools:`);
      tools.tools.forEach(tool => console.log(`- ${tool.name}`));
    } catch (e) {
      console.error("Error listing tools:", e);
      process.exit(1);
    }
    
    // Define smaller subset of tools to test first, including the new Omnibug-enhanced tools
    const essentialToolsToTest = [
      // Core Navigation & Screenshot Tools
      { 
        name: 'puppeteer_navigate', 
        params: { 
          url: TEST_URL 
        }
      },
      {
        name: 'puppeteer_screenshot',
        params: {
          name: 'test-screenshot',
          width: 800,
          height: 600
        }
      },
      // Marketing Tech Analysis
      {
        name: 'find-marketing-technologies',
        params: {
          url: TEST_URL,
          waitTime: 2000
        }
      },
      // Marketing Tech Visualization
      {
        name: 'visualize-marketing-tech',
        params: {
          url: TEST_URL,
          highlightMode: "basic"
        }
      },
      // Comprehensive Marketing Stack Analysis
      {
        name: 'scan-marketing-stack',
        params: {
          url: TEST_URL,
          waitTime: 2000
        }
      },
      // SEO analysis
      {
        name: 'check-page-metadata',
        params: {
          url: TEST_URL
        }
      },
    ];
    
    // Define all tools to test with their parameters
    const allToolsToTest = [
      ...essentialToolsToTest,
      // Additional marketing tools
      {
        name: 'analyze-analytics-platforms',
        params: {
          url: TEST_URL,
          waitTime: 2000
        }
      },
      {
        name: 'detect-ad-pixels',
        params: {
          url: TEST_URL,
          waitTime: 2000
        }
      },
      {
        name: 'identify-tag-managers',
        params: {
          url: TEST_URL,
          waitTime: 2000
        }
      },
      {
        name: 'track-marketing-beacons',
        params: {
          url: TEST_URL,
          waitTime: 2000,
          maxRequests: 5
        }
      },
      {
        name: 'highlight-marketing-tools',
        params: {
          url: TEST_URL,
          highlightPixels: true
        }
      },
      // Test Enhanced Marketing Screenshot with different modes
      {
        name: 'visualize-marketing-tech',
        params: {
          url: TEST_URL,
          highlightMode: "detailed"
        }
      },
      // Additional SEO tools
      {
        name: 'audit-seo',
        params: {
          url: TEST_URL
        }
      },
      {
        name: 'evaluate-page-structure',
        params: {
          url: TEST_URL
        }
      },
      {
        name: 'extract-schema-markup',
        params: {
          url: TEST_URL
        }
      }
    ];
    
    // Test essential tools first
    console.log("\n=== Testing Essential Tools ===");
    let essentialSuccessCount = 0;
    
    for (const tool of essentialToolsToTest) {
      const success = await testTool(client, tool.name, tool.params);
      
      if (success) {
        essentialSuccessCount++;
      }
      
      // Add a pause between tests to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`\n✅ Essential tools test completed! ${essentialSuccessCount}/${essentialToolsToTest.length} essential tools tested successfully`);
    
    // Prompt user to continue with all tools
    if (essentialSuccessCount === essentialToolsToTest.length) {
      console.log("\nAll essential tools passed! Do you want to test all tools? (y/n)");
      const answer = await new Promise(resolve => {
        process.stdin.once('data', data => {
          resolve(data.toString().trim().toLowerCase());
        });
      });
      
      if (answer === 'y') {
        console.log("\n=== Testing All Tools ===");
        let totalSuccessCount = essentialSuccessCount;
        const remainingTools = allToolsToTest.slice(essentialToolsToTest.length);
        
        for (const tool of remainingTools) {
          const success = await testTool(client, tool.name, tool.params);
          
          if (success) {
            totalSuccessCount++;
          }
          
          // Add a pause between tests to allow cleanup
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        console.log(`\n✅ Full test completed! ${totalSuccessCount}/${allToolsToTest.length} tools tested successfully`);
      }
    }
  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    // Cleanup
    console.log("Cleaning up...");
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
    
    // Give it a moment to clean up
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Test complete. Exiting.");
  }
}

// Add proper error handling for the main process
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});