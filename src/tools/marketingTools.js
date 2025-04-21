/**
 * Marketing analysis tools
 */
import { z } from "zod";
import * as analyzer from '../marketingAnalyzer.js';
import { detectMarketingPixels, analyzeNetworkRequests } from '../analytics/pixelDetector.js';
import { setupRequestInterception, filterMarketingRequests } from '../utils/requestInterceptor.js';

export function registerMarketingTools(server, initBrowser) {
  // 1. General marketing tech analysis
  server.tool(
    "analyze-general-marketing-tech",
    "Get a high-level overview of all marketing technologies on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds for delayed pixels to fire")
    },
    async ({ url, waitTime }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Configure performance options
        await page.setCacheEnabled(true); // Enable caching
        
        // Use lightweight mode for faster analysis
        const analysisOptions = {
          additionalWait: waitTime || 2000,
          includeAllRequests: false,
          waitUntil: 'domcontentloaded',  // Less strict than networkidle2
          timeout: 60000, // 60 second timeout
          blockResources: ['image', 'font', 'media'] // Block heavy resources
        };
        
        // Perform the analysis with optimized settings
        console.error(`Starting analysis of ${url}`);
        const analysisResult = await analyzer.analyzeMarketingTech(page, url, analysisOptions);
        
        // Close the page
        await page.close();
        
        // Create a simplified summary
        const summary = {
          url: analysisResult.url,
          scanTime: analysisResult.scanTime,
          pageTitle: analysisResult.pageTitle,
          technologies: analysisResult.marketingTech.technologies,
          totalTrackers: analysisResult.marketingTech.networkActivity.totalRequests,
          marketingTrackers: analysisResult.marketingTech.networkActivity.marketingRequests
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(summary, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing page: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 2. Specific analytics tools analysis
  server.tool(
    "analyze-analytics-tools",
    "Deep dive into analytics platforms (GA4, UA, Adobe Analytics, etc.) on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds")
    },
    async ({ url, waitTime }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Use the improved request interception utility
        const requests = await setupRequestInterception(page, {
          blockResources: ['image', 'font', 'media'] // Block heavy resources
        });
        
        // Navigate to URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Additional wait time for delayed pixel fires
        if (waitTime) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Detect marketing pixels with focus on analytics
        const pixelAnalysis = await detectMarketingPixels(page);
        
        // Filter analytics-specific technologies and requests
        const analyticsTech = pixelAnalysis.technologies.filter(tech => 
          tech.category === 'Analytics' || 
          tech.name.includes('Google Analytics') || 
          tech.name.includes('Adobe Analytics') ||
          tech.name.includes('Segment') ||
          tech.name.includes('Mixpanel') ||
          tech.name.includes('Clarity') ||
          tech.name.includes('Hotjar')
        );
        
        // Filter for analytics network requests
        const analyticsRequests = requests.filter(req => 
          req.url.includes('google-analytics.com') || 
          req.url.includes('analytics') || 
          req.url.includes('segment.io') || 
          req.url.includes('mixpanel.com') || 
          req.url.includes('hotjar.com') || 
          req.url.includes('clarity.ms') ||
          req.url.includes('omtrdc.net')
        );
        
        // Extract IDs
        const analyticsIds = {};
        if (pixelAnalysis.pixelIds.ga4) {
          analyticsIds.ga4 = pixelAnalysis.pixelIds.ga4;
        }
        if (pixelAnalysis.pixelIds.ua) {
          analyticsIds.ua = pixelAnalysis.pixelIds.ua;
        }
        
        // Compile analytics-specific analysis
        const analyticsAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          analyticsTools: analyticsTech,
          dataLayerSample: pixelAnalysis.dataLayerSample,
          analyticsIds: analyticsIds,
          analyticsRequests: analyticsRequests.slice(0, 10).map(req => ({
            url: req.url,
            type: req.resourceType
          }))
        };
        
        // Close the page
        await page.close();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(analyticsAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing analytics tools: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 3. Advertising pixels analysis
  server.tool(
    "analyze-advertising-pixels",
    "Focus on advertising platforms (Facebook, TikTok, etc.) on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds")
    },
    async ({ url, waitTime }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Use the improved request interception utility
        const requests = await setupRequestInterception(page, {
          blockResources: ['image', 'font'] // Block less essential resources
        });
        
        // Navigate to URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Additional wait time for delayed pixel fires
        if (waitTime) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Detect marketing pixels with focus on advertising
        const pixelAnalysis = await detectMarketingPixels(page);
        
        // Filter advertising-specific technologies
        const adTech = pixelAnalysis.technologies.filter(tech => 
          tech.category === 'Advertising' || 
          tech.name.includes('Facebook') || 
          tech.name.includes('TikTok') ||
          tech.name.includes('Twitter') ||
          tech.name.includes('Pinterest') ||
          tech.name.includes('LinkedIn') ||
          tech.name.includes('Pixel')
        );
        
        // Filter for advertising network requests
        const adRequests = requests.filter(req => 
          req.url.includes('facebook.com/tr') || 
          req.url.includes('facebook.net') || 
          req.url.includes('analytics.tiktok.com') || 
          req.url.includes('platform.twitter.com') || 
          req.url.includes('ads') || 
          req.url.includes('pixel') ||
          req.url.includes('pinterest.com/ct') ||
          req.url.includes('linkedin.com/px')
        );
        
        // Extract advertising IDs
        const adIds = {};
        if (pixelAnalysis.pixelIds.facebook) {
          adIds.facebook = pixelAnalysis.pixelIds.facebook;
        }
        if (pixelAnalysis.pixelIds.tiktok) {
          adIds.tiktok = pixelAnalysis.pixelIds.tiktok;
        }
        
        // Compile advertising-specific analysis
        const adAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          advertisingTools: adTech,
          pixelIds: adIds,
          adRequests: adRequests.slice(0, 10).map(req => ({
            url: req.url,
            type: req.resourceType
          }))
        };
        
        // Close the page
        await page.close();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(adAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing advertising pixels: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 4. Tag managers analysis
  server.tool(
    "analyze-tag-managers",
    "Analyze tag management systems (GTM, Tealium, etc.) on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds")
    },
    async ({ url, waitTime }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Use the improved request interception utility
        await setupRequestInterception(page, {
          blockResources: ['image', 'font', 'media'] // Block heavy resources
        });
        
        // Navigate to URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Additional wait time
        if (waitTime) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Detect marketing pixels with focus on tag managers
        const pixelAnalysis = await detectMarketingPixels(page);
        
        // Filter tag manager technologies
        const tagManagers = pixelAnalysis.technologies.filter(tech => 
          tech.category === 'Tag Management' || 
          tech.name.includes('Tag Manager') || 
          tech.name.includes('Tealium') ||
          tech.name.includes('Ensighten') ||
          tech.name.includes('Launch') ||
          tech.name.includes('DTM')
        );
        
        // Extract dataLayer sample if available
        const dataLayerInfo = pixelAnalysis.dataLayerSample ? {
          dataLayerSample: pixelAnalysis.dataLayerSample,
          dataLayerEvents: await page.evaluate(() => {
            // Safely extract events from dataLayer
            try {
              if (window.dataLayer && Array.isArray(window.dataLayer)) {
                return window.dataLayer
                  .filter(item => item.event)
                  .map(item => item.event)
                  .slice(0, 10);
              }
              return [];
            } catch (e) {
              return [];
            }
          })
        } : {};
        
        // Extract tag manager IDs
        const tagManagerIds = {};
        if (pixelAnalysis.pixelIds.gtm) {
          tagManagerIds.gtm = pixelAnalysis.pixelIds.gtm;
        }
        
        // Compile tag manager analysis
        const tagManagerAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          tagManagers,
          tagManagerIds,
          ...dataLayerInfo
        };
        
        // Close the page
        await page.close();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(tagManagerAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing tag managers: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 5. Network requests analysis
  server.tool(
    "analyze-network-requests",
    "Analyze network requests for tracking and marketing activities",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds"),
      maxRequests: z.number().optional().describe("Maximum number of requests to include in results")
    },
    async ({ url, waitTime, maxRequests }) => {
      try {
        // Initialize browser
        const browser = await initBrowser();
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Setup request interception with error handling
        let requests = [];
    try {
      requests = await setupRequestInterception(page);
    } catch (error) {
      console.error(`Error setting up request interception: ${error.message}`);
      // Continue with empty requests array rather than failing
    }
        
        // Navigate to URL
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Additional wait time for delayed pixel fires
        if (waitTime) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Filter marketing-related requests
        const marketingRequests = filterMarketingRequests(requests);
        
        // Analyze network requests
        const networkAnalysis = analyzeNetworkRequests(requests);
        
        // Compile network analysis
        const requestsAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          summary: {
            totalRequests: requests.length,
            marketingRequests: marketingRequests.length,
            trackersByVendor: {
              google: networkAnalysis.beaconsByVendor.google.length,
              facebook: networkAnalysis.beaconsByVendor.facebook.length,
              tiktok: networkAnalysis.beaconsByVendor.tiktok.length,
              twitter: networkAnalysis.beaconsByVendor.twitter.length,
              adobe: networkAnalysis.beaconsByVendor.adobe.length,
              microsoft: networkAnalysis.beaconsByVendor.microsoft.length,
              pinterest: networkAnalysis.beaconsByVendor.pinterest.length,
              linkedin: networkAnalysis.beaconsByVendor.linkedin.length,
              other: networkAnalysis.beaconsByVendor.other.length
            }
          },
          detailedTrackers: {
            google: networkAnalysis.beaconsByVendor.google.slice(0, maxRequests || 5),
            facebook: networkAnalysis.beaconsByVendor.facebook.slice(0, maxRequests || 5),
            tiktok: networkAnalysis.beaconsByVendor.tiktok.slice(0, maxRequests || 5),
            twitter: networkAnalysis.beaconsByVendor.twitter.slice(0, maxRequests || 5),
            adobe: networkAnalysis.beaconsByVendor.adobe.slice(0, maxRequests || 5),
            microsoft: networkAnalysis.beaconsByVendor.microsoft.slice(0, maxRequests || 5),
            pinterest: networkAnalysis.beaconsByVendor.pinterest.slice(0, maxRequests || 5),
            linkedin: networkAnalysis.beaconsByVendor.linkedin.slice(0, maxRequests || 5),
            other: networkAnalysis.beaconsByVendor.other.slice(0, maxRequests || 5)
          }
        };
        
        // Close the page
        await page.close();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(requestsAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing network requests: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // 6. Marketing tech screenshot
  server.tool(
    "create-marketing-tech-screenshot",
    "Take a screenshot with marketing technologies visually highlighted",
    {
      url: z.string().url().describe("The URL of the webpage to screenshot"),
      highlightPixels: z.boolean().optional().describe("Whether to highlight detected marketing pixels")
    },
    async ({ url, highlightPixels = true }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Use the improved request interception utility
        await setupRequestInterception(page, {
          blockResources: ['image', 'font', 'media'] // Block heavy resources
        });
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Additional wait for scripts to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // If highlighting pixels, inject markers
        if (highlightPixels) {
          await page.evaluate(() => {
            // Utility function to add visual markers for pixels
            function addMarker(element, name, color) {
              const marker = document.createElement("div");
              marker.style.position = "absolute";
              marker.style.top = "0";
              marker.style.left = "0";
              marker.style.padding = "5px";
              marker.style.background = color;
              marker.style.color = "white";
              marker.style.borderRadius = "3px";
              marker.style.fontSize = "12px";
              marker.style.fontWeight = "bold";
              marker.style.zIndex = "10000";
              marker.style.pointerEvents = "none";
              marker.textContent = name;
              
              const rect = element.getBoundingClientRect();
              marker.style.top = `${rect.top}px`;
              marker.style.left = `${rect.left}px`;
              
              document.body.appendChild(marker);
              
              // Highlight the element
              element.style.outline = `2px solid ${color}`;
            }
            
            // Find and mark pixel scripts
            const scripts = document.querySelectorAll("script");
            scripts.forEach(script => {
              const src = script.src || "";
              const content = script.innerHTML || "";
              
              if (src.includes("googletagmanager")) {
                addMarker(script, "GTM", "#4285F4");
              } else if (src.includes("google-analytics")) {
                addMarker(script, "GA", "#34A853");
              } else if (src.includes("facebook")) {
                addMarker(script, "FB", "#3b5998");
              } else if (src.includes("tiktok")) {
                addMarker(script, "TikTok", "#000000");
              } else if (content.includes("fbq") || content.includes("gtag") || content.includes("dataLayer")) {
                addMarker(script, "Pixel", "#F56565");
              }
            });
            
            // Find and mark pixel iframes
            const iframes = document.querySelectorAll("iframe");
            iframes.forEach(iframe => {
              const src = iframe.src || "";
              
              if (src.includes("doubleclick") || src.includes("facebook") || src.includes("ads")) {
                addMarker(iframe, "Ad/Pixel", "#D69E2E");
              }
            });
            
            // Find and mark pixel images
            const images = document.querySelectorAll("img");
            images.forEach(img => {
              const src = img.src || "";
              
              if (
                src.includes("pixel") || 
                src.includes("track") || 
                src.includes("analytics") || 
                src.includes("beacon")
              ) {
                addMarker(img, "Pixel", "#805AD5");
              }
            });
          });
        }
        
        // Take a screenshot
        const screenshot = await page.screenshot({ encoding: "base64", fullPage: true });
        
        // Close the page
        await page.close();
        
        // Return the screenshot as base64
        return {
          content: [{
            type: "image",
            mimeType: "image/png",
            data: screenshot
          }]
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