#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 * This script tests all the available tools in the MCP server
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Test website to analyze
const TEST_URL = 'https://www.nytimes.com';

// Function to test a specific tool
async function testTool(client, toolName, params) {
  console.log(`\n=== Testing tool: ${toolName} ===`);
  try {
    const result = await client.callTool({
      name: toolName,
      arguments: params
    });
    
    // For image content, just indicate success
    if (result.content && result.content.some(item => item.type === 'image')) {
      console.log(`✅ Success: Received image content`);
    } else {
      // For text content, log a snippet
      const textContent = result.content.find(item => item.type === 'text')?.text;
      console.log(`✅ Success: ${textContent ? textContent.substring(0, 100) + '...' : 'No text content'}`);
    }
  } catch (error) {
    console.error(`❌ Error testing ${toolName}:`, error.message);
  }
}

async function main() {
  // Start the server process
  const server = spawn('node', ['index.js']);
  
  // Set up error handling for the server process
  server.stderr.on('data', (data) => {
    console.log(`Server stderr: ${data}`);
  });
  
  // Create MCP client
  const transport = new StdioClientTransport({
    process: server
  });
  
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });
  
  try {
    // Connect client to server
    client.connect(transport);
    
    // Wait a bit for the server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // List available tools
    console.log("Listing available tools...");
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => console.log(`- ${tool.name}`));
    
    // Test core tools
    await testTool(client, 'puppeteer_navigate', { url: TEST_URL });
    await testTool(client, 'puppeteer_screenshot', { 
      name: 'test-screenshot',
      width: 800,
      height: 600
    });
    
    // Test marketing analysis tools
    await testTool(client, 'analyze-general-marketing-tech', { 
      url: TEST_URL,
      waitTime: 1000
    });
    
    await testTool(client, 'analyze-analytics-tools', { 
      url: TEST_URL,
      waitTime: 1000
    });
    
    await testTool(client, 'create-marketing-tech-screenshot', { 
      url: TEST_URL,
      highlightPixels: true
    });
    
    // Test SEO tools
    await testTool(client, 'analyze-seo-metadata', { 
      url: TEST_URL
    });
    
    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("❌ Error during testing:", error.message);
  } finally {
    // Cleanup
    client.close();
    server.kill();
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});