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
    "find-marketing-technologies",
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
    "analyze-analytics-platforms",
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
        // Only block images but not scripts - important for Adobe detection
        const requests = await setupRequestInterception(page, {
          blockResources: ['image'] // Don't block font/media which might contain analytics code
        });
        
        // Navigate to URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Wait longer for analytics tools to initialize (Adobe tools load async)
        const actualWaitTime = waitTime || 3000; // Use at least 3 seconds for analytics
        console.error(`Waiting ${actualWaitTime}ms for analytics tools to initialize`);
        await new Promise(resolve => setTimeout(resolve, actualWaitTime));
        
        // Detect marketing pixels with focus on analytics
        const pixelAnalysis = await detectMarketingPixels(page);
        
        // Filter analytics-specific technologies and requests
        const analyticsTech = pixelAnalysis.technologies.filter(tech => 
          tech.category === 'Analytics' || 
          tech.vendor === 'Adobe' || // Ensure we capture all Adobe tools regardless of category
          tech.name.includes('Google Analytics') || 
          tech.name.includes('Analytics') ||
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
          req.url.includes('omtrdc.net') ||
          req.url.includes('demdex.net') ||
          req.url.includes('2o7.net') ||
          req.url.includes('/b/ss/') ||
          req.url.includes('/AppMeasurement') ||
          req.url.includes('adobedc.net')
        );
        
        // Extract IDs
        const analyticsIds = {};
        if (pixelAnalysis.pixelIds.ga4) {
          analyticsIds.ga4 = pixelAnalysis.pixelIds.ga4;
        }
        if (pixelAnalysis.pixelIds.ua) {
          analyticsIds.ua = pixelAnalysis.pixelIds.ua;
        }
        if (pixelAnalysis.pixelIds.adobeAnalytics) {
          analyticsIds.adobeAnalytics = pixelAnalysis.pixelIds.adobeAnalytics;
        }
        if (pixelAnalysis.pixelIds.adobeReportSuite) {
          analyticsIds.adobeReportSuite = pixelAnalysis.pixelIds.adobeReportSuite;
        }
        if (pixelAnalysis.pixelIds.adobeEcid) {
          analyticsIds.adobeEcid = pixelAnalysis.pixelIds.adobeEcid;
        }
        
        // Check for custom analytics implementations
        const customAnalytics = await page.evaluate(() => {
          // Look for common custom analytics patterns
          const customPatterns = {
            analyticsScripts: Array.from(document.scripts)
              .filter(script => {
                const src = script.src.toLowerCase();
                const content = script.innerHTML.toLowerCase();
                return (
                  src.includes('/analytics/') ||
                  src.includes('/stats/') ||
                  src.includes('/tracking/') ||
                  src.includes('/core.js') ||
                  src.includes('/sync.js') ||
                  content.includes('pageview') ||
                  content.includes('trackEvent') ||
                  content.includes('trackPage')
                ) &&
                // Exclude known implementations
                !src.includes('google-analytics.com') &&
                !src.includes('analytics.tiktok.com');
              })
              .map(script => ({
                src: script.src,
                inline: script.src ? false : true
              })).slice(0, 5),
            
            // Data layer patterns other than GTM
            dataObjects: [
              'digitalData', // Adobe Data Layer
              'utag_data', // Tealium Data Layer
              'appEventData', // Facebook CAPI
              'pageData', // Common custom analytics
              'analyticsData', // Common custom analytics
              'trackingData' // Common custom analytics
            ].filter(varName => typeof window[varName] !== 'undefined')
          };
          
          return customPatterns;
        });
        
        // Compile analytics-specific analysis
        const analyticsAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          analyticsTools: analyticsTech,
          dataLayerSample: pixelAnalysis.dataLayerSample,
          analyticsIds: analyticsIds,
          customAnalytics: customAnalytics,
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
    "detect-ad-pixels",
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
    "identify-tag-managers",
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
    "track-marketing-beacons",
    "Analyze network requests for tracking and marketing activities",
    {
      url: z.string().url().describe("The URL of the webpage to analyze"),
      waitTime: z.number().optional().describe("Additional time to wait in milliseconds"),
      maxRequests: z.number().optional().describe("Maximum number of requests to include in results")
    },
    async ({ url, waitTime, maxRequests }) => {
      try {
        // Initialize browser
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a desktop viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Setup request interception with error handling
        // Only block images to preserve other resources that might be analytics-related
        let requests = [];
        try {
          requests = await setupRequestInterception(page, {
            blockResources: ['image'] // Don't block scripts, fonts, etc. which might have analytics
          });
        } catch (error) {
          console.error(`Error setting up request interception: ${error.message}`);
          // Continue with empty requests array rather than failing
        }
        
        // Navigate to URL
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 60000 // 60 second timeout
        });
        
        // Additional wait time for delayed pixel fires
        const actualWaitTime = waitTime || 3000; // Use at least 3 seconds for analytics
        console.error(`Waiting ${actualWaitTime}ms for network requests to complete`);
        await new Promise(resolve => setTimeout(resolve, actualWaitTime));
        
        // Filter marketing-related requests
        const marketingRequests = filterMarketingRequests(requests);
        
        // Analyze network requests
        const networkAnalysis = analyzeNetworkRequests(requests);
        
        // Run custom analytics beacon detection for technologies that use custom domains
        const customBeacons = await page.evaluate(() => {
          // Find all image pixels that might be tracking beacons
          return Array.from(document.querySelectorAll('img[height="1"], img[width="1"], img[src*="?id="], img[src*="track"]'))
            .map(img => ({
              src: img.src,
              size: `${img.width}x${img.height}`,
              hidden: img.style.display === 'none' || img.style.visibility === 'hidden'
            }))
            .filter(img => img.src); // Only return images with valid src
        });
        
        // Add vendor categorization for custom analytics implementations
        const customVendors = {
          adobe: [],
          custom: []
        };
        
        // Analyze requests for Home Depot-like custom analytics
        requests.forEach(req => {
          const url = req.url;
          try {
            const parsedUrl = new URL(url);
            
            // Check for Adobe Analytics patterns in custom domains
            if (
              (parsedUrl.pathname.includes('/b/ss/') || // Adobe Analytics collection path
               parsedUrl.pathname.includes('/id') || // Experience Cloud ID service
               /\/[^\/]+\/s_code\.js/.test(parsedUrl.pathname)) && // s_code.js
              !networkAnalysis.beaconsByVendor.adobe.some(b => b.url === url)
            ) {
              customVendors.adobe.push({
                url: url,
                type: req.resourceType,
                pattern: 'Custom Adobe implementation'
              });
            }
            // Check for custom analytics patterns
            else if (
              (parsedUrl.pathname.includes('/analytics/') ||
               parsedUrl.pathname.includes('/track/') ||
               parsedUrl.pathname.includes('/stats/') ||
               parsedUrl.pathname.includes('/sync.js') ||
               parsedUrl.pathname.includes('/core.js') ||
               parsedUrl.searchParams.has('event') ||
               parsedUrl.searchParams.has('track')) &&
              !Object.values(networkAnalysis.beaconsByVendor).flat().some(b => b.url === url)
            ) {
              customVendors.custom.push({
                url: url,
                type: req.resourceType,
                pattern: 'Custom analytics pattern'
              });
            }
          } catch (e) {
            // Skip URL parsing errors
          }
        });
        
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
              adobe: networkAnalysis.beaconsByVendor.adobe.length + customVendors.adobe.length,
              microsoft: networkAnalysis.beaconsByVendor.microsoft.length,
              pinterest: networkAnalysis.beaconsByVendor.pinterest.length,
              linkedin: networkAnalysis.beaconsByVendor.linkedin.length,
              other: networkAnalysis.beaconsByVendor.other.length,
              custom: customVendors.custom.length
            }
          },
          trackingPixels: customBeacons.slice(0, maxRequests || 5),
          detailedTrackers: {
            google: networkAnalysis.beaconsByVendor.google.slice(0, maxRequests || 5),
            facebook: networkAnalysis.beaconsByVendor.facebook.slice(0, maxRequests || 5),
            tiktok: networkAnalysis.beaconsByVendor.tiktok.slice(0, maxRequests || 5),
            twitter: networkAnalysis.beaconsByVendor.twitter.slice(0, maxRequests || 5),
            adobe: networkAnalysis.beaconsByVendor.adobe.slice(0, maxRequests || 5).concat(customVendors.adobe.slice(0, maxRequests || 5)),
            microsoft: networkAnalysis.beaconsByVendor.microsoft.slice(0, maxRequests || 5),
            pinterest: networkAnalysis.beaconsByVendor.pinterest.slice(0, maxRequests || 5),
            linkedin: networkAnalysis.beaconsByVendor.linkedin.slice(0, maxRequests || 5),
            other: networkAnalysis.beaconsByVendor.other.slice(0, maxRequests || 5),
            custom: customVendors.custom.slice(0, maxRequests || 5)
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
    "highlight-marketing-tools",
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