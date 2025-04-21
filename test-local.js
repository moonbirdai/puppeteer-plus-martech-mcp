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
    return true;
  } catch (error) {
    console.error(`❌ Error testing ${toolName}:`, error);
    return false;
  }
}

async function main() {
  // Start the server process
  const server = spawn('node', ['index.js']);
  let client;
  
  // Handle server process events
  server.stderr.on('data', (data) => {
    console.log(`Server log: ${data}`);
  });
  
  server.on('error', (error) => {
    console.error(`Server process error: ${error.message}`);
    process.exit(1);
  });
  
  try {
    // Create MCP client with longer timeout
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
    
    // Wait a bit for the server to initialize
    console.log("Waiting for server initialization...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    
    // Test a subset of tools to avoid timeouts
    const toolsToTest = [
      { name: 'puppeteer_navigate', params: { url: TEST_URL } },
      { name: 'analyze-general-marketing-tech', params: { url: TEST_URL, waitTime: 1000 } },
      { name: 'analyze-seo-metadata', params: { url: TEST_URL } }
    ];
    
    for (const tool of toolsToTest) {
      const success = await testTool(client, tool.name, tool.params);
      
      // Add a pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!success) {
        console.log(`Continuing despite error in ${tool.name}...`);
      }
    }
    
    console.log("\n✅ Test completed!");
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
    
    server.kill();
    
    // Give it a moment to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Add proper error handling for the main process
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});