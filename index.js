#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from "puppeteer";
import { z } from "zod";

// Import core tools
import { registerCoreTools } from "./src/tools/coreTools.js";

// Import marketing analysis tools
import { registerMarketingTools } from "./src/tools/marketingTools.js";

// Import SEO analysis tools
import { registerSeoTools } from "./src/tools/seoTools.js";

// Create the MCP server
const server = new McpServer({
  name: "puppeteer-plus",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Shared browser instance
let browser;

// Initialize the browser
async function initBrowser(options = {}) {
  if (!browser || !browser.connected) {
    const defaultOptions = {
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    };
    
    browser = await puppeteer.launch(Object.assign({}, defaultOptions, options || {}));
  }
  
  return browser;
}

// Helper to cleanup browser on shutdown
async function cleanup() {
  if (browser) {
    await browser.close();
    browser = null;
    console.error("Browser closed");
  }
}

// Register all tool categories
registerCoreTools(server, initBrowser);
registerMarketingTools(server, initBrowser);
registerSeoTools(server, initBrowser);

// Handle process termination
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

// Connect to the MCP transport
const transport = new StdioServerTransport();
(async () => {
  await server.connect(transport);
  console.error("Puppeteer Plus MCP Server started");
})();

// Handle stdin closing
process.stdin.on("close", async () => {
  console.error("Puppeteer Plus MCP Server closed");
  await cleanup();
  server.close();
});