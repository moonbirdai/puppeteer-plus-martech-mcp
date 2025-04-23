/**
 * Beacon Capture Utility
 * Advanced utilities for capturing and processing analytics beacons
 */
import providerRegistry from '../providers/index.js';
import { setupRequestInterception } from './requestInterceptor.js';

/**
 * Captures analytics beacons from a page with enhanced filtering and processing
 * 
 * @param {Object} page - Puppeteer page object
 * @param {Object} options - Configuration options
 * @param {number} options.waitTime - Time to wait for beacons to fire (milliseconds)
 * @param {boolean} options.includeBody - Whether to include request body data
 * @param {string[]} options.providerTypes - Types of providers to capture (default: all)
 * @returns {Promise<Object>} Captured and processed beacons
 */
export async function captureAnalyticsBeacons(page, options = {}) {
    const defaultOptions = {
        waitTime: 3000,
        includeBody: true,
        providerTypes: ['analytics'] // Default to only analytics providers
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Setup request interception to capture beacons
    const requests = await setupRequestInterception(page, {
        blockResources: ['image', 'font', 'media'], // Block non-essential resources
        captureBody: config.includeBody // Capture POST body data when needed
    });
    
    // Wait for the specified time to ensure beacons are captured
    if (config.waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, config.waitTime));
    }
    
    // Process captured requests
    return processAnalyticsBeacons(requests, config);
}

/**
 * Process captured network requests to identify and parse analytics beacons
 * 
 * @param {Array} requests - Captured network requests
 * @param {Object} options - Processing options
 * @returns {Object} Processed analytics data
 */
export function processAnalyticsBeacons(requests, options = {}) {
    const result = {
        timestamp: new Date().toISOString(),
        beacons: [],
        summary: {
            totalRequests: requests.length,
            analyticsRequests: 0,
            providers: {}
        }
    };
    
    // Filter requests for analytics beacons
    for (const request of requests) {
        // Skip non-network requests
        if (!request.url) continue;

        // Check if this URL matches any provider
        if (providerRegistry.checkUrl(request.url)) {
            // Get matching providers
            const matchingProviders = providerRegistry.getMatchingProviders(request.url);
            
            // Skip if no matching providers
            if (!matchingProviders.length) continue;
            
            // Filter by provider type if specified
            const filteredProviders = options.providerTypes?.length
                ? matchingProviders.filter(provider => 
                    options.providerTypes.includes(provider.type))
                : matchingProviders;
            
            // Skip if no matching provider types
            if (!filteredProviders.length) continue;
            
            // Process each matching provider
            for (const provider of filteredProviders) {
                try {
                    // Parse the request with the provider
                    const parsedData = provider.parseUrl(
                        request.url, 
                        request.postData || ""
                    );
                    
                    // Skip if no parsed data
                    if (!parsedData) continue;
                    
                    // Count this as an analytics request
                    result.summary.analyticsRequests++;
                    
                    // Track provider counts
                    const providerName = provider.name;
                    if (!result.summary.providers[providerName]) {
                        result.summary.providers[providerName] = 1;
                    } else {
                        result.summary.providers[providerName]++;
                    }
                    
                    // Add the beacon to the result
                    result.beacons.push({
                        url: request.url,
                        method: request.method,
                        timestamp: request.timestamp || new Date().toISOString(),
                        provider: provider.name,
                        providerKey: provider.key,
                        type: provider.type,
                        requestType: parsedData.data.find(d => d.key === 'requestType')?.value || 'Unknown',
                        parsedData: parsedData.data,
                        groups: parsedData.provider.groups,
                        rawContent: options.includeRaw ? {
                            url: request.url,
                            postData: request.postData || null
                        } : undefined
                    });
                } catch (error) {
                    console.error(`Error processing beacon with ${provider.name}: ${error.message}`);
                }
            }
        }
    }

    // Sort beacons by timestamp
    result.beacons.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return a.timestamp.localeCompare(b.timestamp);
    });
    
    return result;
}

/**
 * Simulates a user interaction and captures resulting beacons
 * 
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element to interact with
 * @param {string} action - Type of interaction (click, hover, scroll)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Captured beacons from the interaction
 */
export async function captureInteractionBeacons(page, selector, action = 'click', options = {}) {
    const defaultOptions = {
        waitTime: 3000, // Wait time after interaction
        preWait: 1000,  // Wait time before interaction to establish baseline
        includeBody: true,
        providerTypes: ['analytics']
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Setup request interception
    const requests = await setupRequestInterception(page, {
        blockResources: ['image', 'font', 'media'],
        captureBody: config.includeBody
    });
    
    // Wait before interaction to establish baseline
    await new Promise(resolve => setTimeout(resolve, config.preWait));
    
    // Clear requests captured during the pre-wait period
    requests.length = 0;
    
    // Perform the requested interaction
    try {
        switch (action.toLowerCase()) {
            case 'click':
                await page.click(selector);
                break;
            case 'hover':
                await page.hover(selector);
                break;
            case 'scroll':
                await page.evaluate((sel) => {
                    const element = document.querySelector(sel);
                    if (element) element.scrollIntoView();
                }, selector);
                break;
            case 'type':
                if (options.text) {
                    await page.type(selector, options.text);
                }
                break;
            default:
                await page.click(selector);
        }
    } catch (error) {
        return {
            error: `Interaction failed: ${error.message}`,
            selector,
            action,
            beacons: []
        };
    }
    
    // Wait for beacons to fire after interaction
    await new Promise(resolve => setTimeout(resolve, config.waitTime));
    
    // Process captured beacons
    const result = processAnalyticsBeacons(requests, config);
    
    // Add interaction metadata
    result.interaction = {
        selector,
        action,
        timestamp: new Date().toISOString()
    };
    
    return result;
}
