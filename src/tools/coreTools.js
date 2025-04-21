/**
 * Core Puppeteer navigation and screenshot tools
 */
import { z } from "zod";

export function registerCoreTools(server, initBrowser) {
  // Tool to navigate to a URL
  server.tool(
    "puppeteer_navigate",
    "Navigate to a URL",
    {
      url: z.string().describe("URL to navigate to"),
      launchOptions: z.object({}).optional().describe("PuppeteerJS LaunchOptions. Default null."),
      allowDangerous: z.boolean().optional().describe("Allow dangerous LaunchOptions that reduce security.")
    },
    async ({ url, launchOptions, allowDangerous }) => {
      try {
        // Initialize browser with potential custom options
        const options = allowDangerous ? { args: ["--no-sandbox", "--disable-setuid-sandbox"] } : {};
        const browser = await initBrowser(Object.assign({}, options, launchOptions || {}));
        
        // Create a new page if needed
        const page = (await browser.pages())[0] || await browser.newPage();
        
        // Navigate to the URL
        await page.goto(url, { waitUntil: "networkidle2" });
        
        return {
          content: [{
            type: "text",
            text: `Navigated to ${url}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error navigating to ${url}: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to take a screenshot
  server.tool(
    "puppeteer_screenshot",
    "Take a screenshot of the current page or a specific element",
    {
      name: z.string().describe("Name for the screenshot"),
      selector: z.string().optional().describe("CSS selector for element to screenshot"),
      width: z.number().optional().describe("Width in pixels (default: 800)"),
      height: z.number().optional().describe("Height in pixels (default: 600)")
    },
    async ({ name, selector, width, height }) => {
      try {
        // Initialize browser
        const browser = await initBrowser();
        
        // Get first page
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Set viewport
        await page.setViewport({ 
          width: width || 800, 
          height: height || 600 
        });
        
        // Take the screenshot
        let screenshot;
        if (selector) {
          const element = await page.$(selector);
          if (!element) {
            return {
              content: [{
                type: "text",
                text: `Element not found: ${selector}`
              }],
              isError: true
            };
          }
          screenshot = await element.screenshot({ encoding: "base64" });
        } else {
          screenshot = await page.screenshot({ encoding: "base64", fullPage: true });
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Screenshot '${name}' taken successfully`
            },
            {
              type: "image",
              mimeType: "image/png",
              data: screenshot
            }
          ]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error taking screenshot: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}