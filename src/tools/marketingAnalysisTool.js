/**
 * Enhanced Marketing and Analytics Detection Tools
 * Using the provider framework adapted from Omnibug
 */
import { z } from "zod";
import providerRegistry from '../providers/index.js';
import { setupRequestInterception } from '../utils/requestInterceptor.js';

/**
 * Register marketing analysis tools using the provider framework
 * @param {Object} server - MCP server instance
 * @param {Function} initBrowser - Browser initialization function
 */
export function registerMarketingAnalysisTools(server, initBrowser) {
    // Comprehensive marketing technology detection tool
    server.tool(
        "scan-marketing-stack",
        "Comprehensive analysis of all marketing and analytics technologies on a webpage",
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
                
                // Intercept requests to identify analytics and marketing calls
                const requests = await setupRequestInterception(page, {
                    blockResources: ['image', 'font', 'media'] // Block heavy resources
                });
                
                // Navigate to URL with extended timeout
                await page.goto(url, { 
                    waitUntil: 'networkidle2', 
                    timeout: 60000 // 60 second timeout
                });
                
                // Additional wait time for delayed pixel fires
                const actualWaitTime = waitTime || 3000; // Use at least 3 seconds for delayed pixels
                console.error(`Waiting ${actualWaitTime}ms for marketing pixels to fire`);
                await new Promise(resolve => setTimeout(resolve, actualWaitTime));
                
                // Get all marketing tech detection from the page
                const detectedTechnologies = await page.evaluate(() => {
                    /**
                     * Check for common marketing and analytics tools in the global scope
                     */
                    function detectMarketingTech() {
                        const tools = {};
                        
                        // Google Analytics presence (Universal Analytics)
                        if (typeof window.ga === 'function' || typeof window._ga === 'function' || typeof window.GoogleAnalyticsObject === 'string') {
                            tools.googleAnalytics = {
                                name: 'Google Analytics (Universal)',
                                found: true,
                                properties: {}
                            };
                            
                            // Try to extract GA settings
                            try {
                                if (typeof ga === 'function' && typeof ga.getAll === 'function') {
                                    const trackers = ga.getAll();
                                    tools.googleAnalytics.properties.trackers = trackers.map(tracker => ({
                                        name: tracker.get('name'),
                                        trackingId: tracker.get('trackingId')
                                    }));
                                }
                            } catch (e) {
                                tools.googleAnalytics.properties.error = e.message;
                            }
                        }
                        
                        // Google Analytics 4
                        if (typeof window.gtag === 'function') {
                            tools.googleAnalytics4 = {
                                name: 'Google Analytics 4',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // Google Tag Manager
                        if (typeof window.dataLayer === 'object') {
                            tools.googleTagManager = {
                                name: 'Google Tag Manager',
                                found: true,
                                properties: {
                                    dataLayer: Array.isArray(window.dataLayer) ? 
                                               window.dataLayer.slice(0, 5) : // Take only the first 5 items
                                               'detected but not an array'
                                }
                            };
                            
                            // Try to extract the GTM ID from the script tag
                            const gtmScripts = Array.from(document.querySelectorAll('script[src*="googletagmanager.com"]'));
                            if (gtmScripts.length > 0) {
                                const gtmIds = gtmScripts.map(script => {
                                    const match = script.src.match(/\/gtm\?id=(GTM-[A-Z0-9]+)/);
                                    return match ? match[1] : null;
                                }).filter(Boolean);
                                
                                if (gtmIds.length > 0) {
                                    tools.googleTagManager.properties.ids = gtmIds;
                                }
                            }
                        }
                        
                        // Facebook Pixel
                        if (typeof window.fbq === 'function' || typeof window._fbq === 'function') {
                            tools.facebookPixel = {
                                name: 'Facebook Pixel',
                                found: true,
                                properties: {}
                            };
                            
                            // Try to extract the pixel ID
                            try {
                                if (typeof fbq === 'function' && typeof fbq.getState === 'function') {
                                    const fbState = fbq.getState();
                                    if (fbState && fbState.pixelConfigs && fbState.pixelConfigs.length > 0) {
                                        tools.facebookPixel.properties.pixelIds = fbState.pixelConfigs.map(p => p.id);
                                    }
                                }
                                
                                // Alternative method for older pixels
                                const fbMetaTags = Array.from(document.querySelectorAll('meta[property="fb:pixel_id"]'));
                                if (fbMetaTags.length > 0) {
                                    tools.facebookPixel.properties.metaTagIds = fbMetaTags.map(tag => tag.content);
                                }
                            } catch (e) {
                                tools.facebookPixel.properties.error = e.message;
                            }
                        }
                        
                        // Adobe Analytics
                        if (typeof window.s === 'object' && window.s !== null) {
                            tools.adobeAnalytics = {
                                name: 'Adobe Analytics',
                                found: true,
                                properties: {}
                            };
                            
                            // Try to extract Adobe Analytics properties
                            try {
                                if (window.s.version) {
                                    tools.adobeAnalytics.properties.version = window.s.version;
                                }
                                if (window.s.account) {
                                    tools.adobeAnalytics.properties.reportSuite = window.s.account;
                                }
                                if (window.s.trackingServer) {
                                    tools.adobeAnalytics.properties.trackingServer = window.s.trackingServer;
                                }
                            } catch (e) {
                                tools.adobeAnalytics.properties.error = e.message;
                            }
                        }
                        
                        // Adobe Launch / Experience Platform Tags
                        if (typeof window._satellite === 'object' && window._satellite !== null) {
                            tools.adobeLaunch = {
                                name: 'Adobe Experience Platform Launch',
                                found: true,
                                properties: {}
                            };
                            
                            // Try to extract Launch properties
                            try {
                                if (window._satellite.buildInfo) {
                                    tools.adobeLaunch.properties.buildInfo = window._satellite.buildInfo;
                                }
                                if (window._satellite.property && window._satellite.property.name) {
                                    tools.adobeLaunch.properties.propertyName = window._satellite.property.name;
                                }
                            } catch (e) {
                                tools.adobeLaunch.properties.error = e.message;
                            }
                        }
                        
                        // TikTok Pixel
                        if (typeof window.ttq === 'object' || typeof window.TiktokAnalyticsObject === 'string') {
                            tools.tiktokPixel = {
                                name: 'TikTok Pixel',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // Hotjar
                        if (typeof window.hj === 'function' || typeof window._hjSettings === 'object') {
                            tools.hotjar = {
                                name: 'Hotjar',
                                found: true,
                                properties: {}
                            };
                            
                            // Try to extract Hotjar ID
                            try {
                                if (window._hjSettings && window._hjSettings.hjid) {
                                    tools.hotjar.properties.id = window._hjSettings.hjid;
                                }
                            } catch (e) {
                                tools.hotjar.properties.error = e.message;
                            }
                        }
                        
                        // Microsoft Clarity
                        if (typeof window.clarity === 'function' || typeof window.clarity === 'object') {
                            tools.microsoftClarity = {
                                name: 'Microsoft Clarity',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // Segment
                        if (typeof window.analytics === 'object' && window.analytics !== null) {
                            tools.segment = {
                                name: 'Segment',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // LinkedIn Insight Tag
                        if (typeof window._linkedin_data_partner_ids === 'object') {
                            tools.linkedinInsight = {
                                name: 'LinkedIn Insight Tag',
                                found: true,
                                properties: {
                                    ids: Array.isArray(window._linkedin_data_partner_ids) ? 
                                         window._linkedin_data_partner_ids : 'detected'
                                }
                            };
                        }
                        
                        // Pinterest Tag
                        if (typeof window.pintrk === 'function') {
                            tools.pinterestTag = {
                                name: 'Pinterest Tag',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // Twitter/X Pixel
                        if (typeof window.twq === 'function') {
                            tools.twitterPixel = {
                                name: 'Twitter/X Pixel',
                                found: true,
                                properties: {}
                            };
                        }
                        
                        // DataLayer inspection (for custom implementations)
                        const dataLayers = {};
                        
                        // Check for common data layer patterns
                        if (typeof window.dataLayer === 'object') {
                            dataLayers.googleDataLayer = Array.isArray(window.dataLayer) ? 
                                                        window.dataLayer.slice(0, 3) : // Take only first 3 items
                                                        'detected but not an array';
                        }
                        
                        if (typeof window.digitalData === 'object') {
                            dataLayers.adobeDataLayer = 'detected';
                        }
                        
                        if (typeof window.utag_data === 'object') {
                            dataLayers.tealiumDataLayer = 'detected';
                        }
                        
                        if (Object.keys(dataLayers).length > 0) {
                            tools.dataLayers = {
                                name: 'Data Layers',
                                found: true,
                                properties: dataLayers
                            };
                        }
                        
                        return tools;
                    }
                    
                    return detectMarketingTech();
                });
                
                // Process captured network requests to find marketing tech calls
                const analyticsRequests = [];
                
                for (const request of requests) {
                    // Check if this request matches any provider patterns
                    if (providerRegistry.checkUrl(request.url)) {
                        try {
                            // Get all providers that match this request
                            const matchingProviders = providerRegistry.getMatchingProviders(request.url);
                            
                            for (const provider of matchingProviders) {
                                // Parse the request with the provider
                                const parsedData = provider.parseUrl(request.url);
                                
                                analyticsRequests.push({
                                    url: request.url,
                                    provider: provider.name,
                                    type: provider.type,
                                    time: request.time,
                                    data: parsedData.data
                                });
                            }
                        } catch (e) {
                            console.error(`Error processing request ${request.url}: ${e.message}`);
                            analyticsRequests.push({
                                url: request.url,
                                error: e.message
                            });
                        }
                    }
                }
                
                // Create a summary of detected tech
                const detectedTech = {
                    analytics: [],
                    advertising: [],
                    tagmanagers: [],
                    other: []
                };
                
                // Add global variable detections
                Object.values(detectedTechnologies).forEach(tech => {
                    if (tech.name.includes('Analytics') || tech.name.includes('Hotjar') || tech.name.includes('Clarity')) {
                        detectedTech.analytics.push({
                            name: tech.name,
                            detectionMethod: 'global variable',
                            properties: tech.properties || {}
                        });
                    } else if (tech.name.includes('Pixel') || tech.name.includes('Insight') || tech.name.includes('Tag')) {
                        detectedTech.advertising.push({
                            name: tech.name,
                            detectionMethod: 'global variable',
                            properties: tech.properties || {}
                        });
                    } else if (tech.name.includes('Manager') || tech.name.includes('Launch')) {
                        detectedTech.tagmanagers.push({
                            name: tech.name,
                            detectionMethod: 'global variable',
                            properties: tech.properties || {}
                        });
                    } else {
                        detectedTech.other.push({
                            name: tech.name,
                            detectionMethod: 'global variable',
                            properties: tech.properties || {}
                        });
                    }
                });
                
                // Add network request detections
                const seenProviders = new Set();
                
                analyticsRequests.forEach(request => {
                    const providerKey = `${request.provider}-${request.type}`;
                    
                    // Skip duplicates
                    if (seenProviders.has(providerKey)) {
                        return;
                    }
                    
                    // Find interesting data items
                    const accountField = request.data?.find(item => 
                        item.field === 'Account' || 
                        item.field === 'Tracking ID' || 
                        item.field === 'Pixel ID' ||
                        item.field === 'Container ID' ||
                        item.field === 'Report Suites'
                    );
                    
                    const properties = {};
                    if (accountField) {
                        properties.account = accountField.value;
                    }
                    
                    // Categorize by type
                    if (request.type === 'Analytics') {
                        detectedTech.analytics.push({
                            name: request.provider,
                            detectionMethod: 'network request',
                            properties
                        });
                    } else if (request.type === 'Marketing') {
                        detectedTech.advertising.push({
                            name: request.provider,
                            detectionMethod: 'network request',
                            properties
                        });
                    } else if (request.type === 'Tag Management') {
                        detectedTech.tagmanagers.push({
                            name: request.provider,
                            detectionMethod: 'network request',
                            properties
                        });
                    } else {
                        detectedTech.other.push({
                            name: request.provider,
                            detectionMethod: 'network request',
                            properties
                        });
                    }
                    
                    seenProviders.add(providerKey);
                });
                
                // Close the page
                await page.close();
                
                // Compile the comprehensive analysis
                const analysis = {
                    url,
                    scanTime: new Date().toISOString(),
                    summary: {
                        analytics: detectedTech.analytics.length,
                        advertising: detectedTech.advertising.length,
                        tagmanagers: detectedTech.tagmanagers.length,
                        other: detectedTech.other.length,
                        total: detectedTech.analytics.length + 
                               detectedTech.advertising.length + 
                               detectedTech.tagmanagers.length + 
                               detectedTech.other.length
                    },
                    detectedTechnologies: detectedTech,
                    dataLayers: detectedTechnologies.dataLayers?.properties || {},
                    requests: {
                        total: requests.length,
                        analytics: analyticsRequests.length
                    }
                };
                
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(analysis, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error analyzing marketing technologies: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
    
    // Visual highlighting of marketing pixels
    server.tool(
        "visualize-marketing-tech",
        "Take a screenshot with detailed marketing technologies visually highlighted",
        {
            url: z.string().url().describe("The URL of the webpage to screenshot"),
            highlightMode: z.enum(["basic", "detailed", "none"]).optional().describe("How to highlight detected marketing technologies")
        },
        async ({ url, highlightMode = "detailed" }) => {
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
                const requests = await setupRequestInterception(page, {
                    blockResources: ['image', 'font', 'media'] // Block heavy resources
                });
                
                // Navigate to the URL with extended timeout
                await page.goto(url, { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 60000 // 60 second timeout
                });
                
                // Wait for scripts to load and execute
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // If highlighting is requested, inject markers
                if (highlightMode !== "none") {
                    await page.evaluate((mode) => {
                        // Utility function to add visual markers for marketing tech
                        function addMarker(element, name, type, color) {
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
                            marker.textContent = mode === "detailed" ? `${name} (${type})` : name;
                            
                            const rect = element.getBoundingClientRect();
                            marker.style.top = `${rect.top}px`;
                            marker.style.left = `${rect.left}px`;
                            
                            document.body.appendChild(marker);
                            
                            // Highlight the element
                            element.style.outline = `2px solid ${color}`;
                        }
                        
                        // Color map for different technology types
                        const colorMap = {
                            'google': '#4285F4',     // Google blue
                            'facebook': '#3b5998',   // Facebook blue
                            'adobe': '#FA0F00',      // Adobe red
                            'microsoft': '#00A4EF',  // Microsoft blue
                            'twitter': '#1DA1F2',    // Twitter blue
                            'tiktok': '#000000',     // TikTok black
                            'hotjar': '#FF3C00',     // Hotjar orange
                            'pinterest': '#E60023',  // Pinterest red
                            'linkedin': '#0077B5',   // LinkedIn blue
                            'segment': '#52BD95',    // Segment green
                            'other': '#6B7280'       // Generic gray
                        };
                        
                        // Find and mark scripts
                        const scripts = document.querySelectorAll("script");
                        scripts.forEach(script => {
                            const src = script.src || "";
                            
                            // Match patterns for different technologies
                            if (src.includes("googletagmanager")) {
                                addMarker(script, "Google Tag Manager", "Tag Manager", colorMap.google);
                            } else if (src.includes("google-analytics")) {
                                addMarker(script, "Google Analytics", "Analytics", colorMap.google);
                            } else if (src.includes("gtag/js")) {
                                addMarker(script, "Google Global Site Tag", "Analytics", colorMap.google);
                            } else if (src.includes("facebook") || src.includes("connect.facebook")) {
                                addMarker(script, "Facebook Pixel", "Marketing", colorMap.facebook);
                            } else if (src.includes("adobedtm") || src.includes("assets.adobedtm")) {
                                addMarker(script, "Adobe Launch", "Tag Manager", colorMap.adobe);
                            } else if (src.includes("omtrdc") || src.includes("/b/ss/")) {
                                addMarker(script, "Adobe Analytics", "Analytics", colorMap.adobe);
                            } else if (src.includes("clarity.ms")) {
                                addMarker(script, "Microsoft Clarity", "Analytics", colorMap.microsoft);
                            } else if (src.includes("tiktok")) {
                                addMarker(script, "TikTok Pixel", "Marketing", colorMap.tiktok);
                            } else if (src.includes("hotjar")) {
                                addMarker(script, "Hotjar", "Analytics", colorMap.hotjar);
                            } else if (src.includes("pintrk") || src.includes("pinterest")) {
                                addMarker(script, "Pinterest Tag", "Marketing", colorMap.pinterest);
                            } else if (src.includes("linkedin")) {
                                addMarker(script, "LinkedIn Tag", "Marketing", colorMap.linkedin);
                            } else if (src.includes("segment")) {
                                addMarker(script, "Segment", "Analytics", colorMap.segment);
                            } else if (src.includes("analytics") || src.includes("tracking")) {
                                addMarker(script, "Analytics (generic)", "Analytics", colorMap.other);
                            }
                        });
                        
                        // Find and mark pixel images
                        const pixelImages = document.querySelectorAll("img[height='1'], img[width='1']");
                        pixelImages.forEach(img => {
                            addMarker(img, "Tracking Pixel", "Marketing", colorMap.other);
                        });
                        
                        // Add a marker for dataLayer if present
                        if (typeof window.dataLayer === 'object') {
                            const marker = document.createElement("div");
                            marker.style.position = "fixed";
                            marker.style.top = "10px";
                            marker.style.right = "10px";
                            marker.style.padding = "5px";
                            marker.style.background = colorMap.google;
                            marker.style.color = "white";
                            marker.style.borderRadius = "3px";
                            marker.style.fontSize = "12px";
                            marker.style.fontWeight = "bold";
                            marker.style.zIndex = "10000";
                            marker.textContent = "dataLayer present";
                            document.body.appendChild(marker);
                        }
                        
                        // Add a marker for Adobe Launch if present
                        if (typeof window._satellite === 'object') {
                            const marker = document.createElement("div");
                            marker.style.position = "fixed";
                            marker.style.top = "40px";
                            marker.style.right = "10px";
                            marker.style.padding = "5px";
                            marker.style.background = colorMap.adobe;
                            marker.style.color = "white";
                            marker.style.borderRadius = "3px";
                            marker.style.fontSize = "12px";
                            marker.style.fontWeight = "bold";
                            marker.style.zIndex = "10000";
                            marker.textContent = "Adobe Launch present";
                            document.body.appendChild(marker);
                        }
                    }, highlightMode);
                }
                
                // Add a summary overlay
                await page.evaluate((requests) => {
                    const technologies = {};
                    
                    // Process network requests to identify technologies
                    requests.forEach(request => {
                        const url = request.url;
                        
                        if (url.includes('google-analytics.com') || url.includes('analytics.google.com')) {
                            technologies['Google Analytics'] = (technologies['Google Analytics'] || 0) + 1;
                        } else if (url.includes('googletagmanager.com')) {
                            technologies['Google Tag Manager'] = (technologies['Google Tag Manager'] || 0) + 1;
                        } else if (url.includes('facebook.com/tr') || url.includes('connect.facebook.net')) {
                            technologies['Facebook Pixel'] = (technologies['Facebook Pixel'] || 0) + 1;
                        } else if (url.includes('omtrdc.net') || url.includes('/b/ss/')) {
                            technologies['Adobe Analytics'] = (technologies['Adobe Analytics'] || 0) + 1;
                        } else if (url.includes('adobedtm.com') || url.includes('assets.adobedtm')) {
                            technologies['Adobe Launch'] = (technologies['Adobe Launch'] || 0) + 1;
                        } else if (url.includes('clarity.ms')) {
                            technologies['Microsoft Clarity'] = (technologies['Microsoft Clarity'] || 0) + 1;
                        } else if (url.includes('analytics.tiktok.com')) {
                            technologies['TikTok Pixel'] = (technologies['TikTok Pixel'] || 0) + 1;
                        }
                    });
                    
                    // Create a summary overlay
                    if (Object.keys(technologies).length > 0) {
                        const summary = document.createElement("div");
                        summary.style.position = "fixed";
                        summary.style.bottom = "10px";
                        summary.style.left = "10px";
                        summary.style.padding = "10px";
                        summary.style.background = "rgba(0, 0, 0, 0.8)";
                        summary.style.color = "white";
                        summary.style.borderRadius = "5px";
                        summary.style.fontSize = "14px";
                        summary.style.fontWeight = "bold";
                        summary.style.zIndex = "10001";
                        summary.style.maxWidth = "300px";
                        
                        let summaryHtml = '<div style="margin-bottom:5px;font-size:16px;">Detected Technologies:</div>';
                        
                        for (const [tech, count] of Object.entries(technologies)) {
                            summaryHtml += `<div>${tech}: ${count} request${count > 1 ? 's' : ''}</div>`;
                        }
                        
                        summary.innerHTML = summaryHtml;
                        document.body.appendChild(summary);
                    }
                }, requests);
                
                // Take a screenshot
                const screenshot = await page.screenshot({ encoding: "base64", fullPage: true });
                
                // Close the page
                await page.close();
                
                // Return the screenshot as base64
                return {
                    content: [
                        {
                            type: "text",
                            text: `Screenshot of ${url} with marketing technologies highlighted (mode: ${highlightMode})`
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
                        text: `Error taking enhanced marketing screenshot: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
}
