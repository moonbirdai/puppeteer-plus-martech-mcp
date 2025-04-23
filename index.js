#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from "puppeteer";
import { z } from "zod";

// Import core tools
import { registerCoreTools } from "./src/tools/coreTools.js";

// Import marketing analysis tools
import { registerMarketingTools } from "./src/tools/marketingTools.js";

// Import enhanced marketing analysis tools (Omnibug-based)
import { registerMarketingAnalysisTools } from "./src/tools/marketingAnalysisTool.js";

// Import analytics beacon parser tools
import { registerAnalyticsTools } from "./src/tools/analyticsTools.js";

// Import SEO analysis tools
import { registerSeoTools } from "./src/tools/seoTools.js";

// Create the MCP server
const server = new McpServer({
  name: "puppeteer-plus-martech",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Shared browser instance
let browser;

// Initialize the browser with improved timeout and error handling
async function initBrowser(options = {}) {
  try {
    if (!browser || !browser.connected) {
      console.error("Launching browser...");
      const defaultOptions = {
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        timeout: 60000 // 60 second timeout for browser launch
      };
      
      browser = await puppeteer.launch(Object.assign({}, defaultOptions, options || {}));
      console.error("Browser launched successfully");
    } else {
      console.error("Reusing existing browser instance");
    }
    
    return browser;
  } catch (error) {
    console.error(`Error initializing browser: ${error.message}`);
    throw error;
  }
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
registerMarketingAnalysisTools(server, initBrowser); // Register the enhanced marketing tools
registerAnalyticsTools(server, initBrowser); // Register the analytics beacon parser tools
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
  console.error("Puppeteer+ MarTech MCP Server started");
})();

// Handle stdin closing
process.stdin.on("close", async () => {
  console.error("Puppeteer+ MarTech MCP Server closed");
  await cleanup();
  server.close();
});