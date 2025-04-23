/**
 * Analytics Beacon Parser Tools
 * Tools for capturing and parsing analytics beacons from webpages
 */
import { z } from "zod";
import { captureAnalyticsBeacons, captureInteractionBeacons } from '../utils/beaconCapture.js';

/**
 * Register analytics tools with the server
 * 
 * @param {Object} server - MCP server instance
 * @param {Function} initBrowser - Browser initialization function
 */
export function registerAnalyticsTools(server, initBrowser) {
    // Main tool for parsing analytics beacons
    server.tool(
        "parse-analytics-beacons",
        "Capture and parse Adobe Analytics and Experience Platform beacons on a webpage",
        {
            url: z.string().url().describe("The URL of the webpage to analyze"),
            waitTime: z.number().optional().describe("Time to wait for beacons to fire (milliseconds)"),
            simulateClick: z.string().optional().describe("Optional CSS selector to click for interaction beacons")
        },
        async ({ url, waitTime = 3000, simulateClick }) => {
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
                
                // Navigate to URL with extended timeout
                await page.goto(url, { 
                    waitUntil: 'networkidle2', 
                    timeout: 60000 // 60 second timeout
                });
                
                // Capture page load beacons
                const pageLoadBeacons = await captureAnalyticsBeacons(page, {
                    waitTime,
                    includeBody: true,
                    providerTypes: ['analytics']
                });
                
                // Capture interaction beacons if a selector is provided
                let interactionBeacons = null;
                if (simulateClick) {
                    try {
                        await page.waitForSelector(simulateClick, { timeout: 5000 });
                        interactionBeacons = await captureInteractionBeacons(page, simulateClick, 'click', {
                            waitTime: 3000,
                            includeBody: true,
                            providerTypes: ['analytics']
                        });
                    } catch (clickError) {
                        interactionBeacons = {
                            error: `Failed to find or click element: ${clickError.message}`,
                            selector: simulateClick
                        };
                    }
                }
                
                // Close the page
                await page.close();
                
                // Format and categorize the results
                const result = {
                    url,
                    scanTime: new Date().toISOString(),
                    pageLoad: {
                        beaconCount: pageLoadBeacons.beacons.length,
                        beacons: pageLoadBeacons.beacons
                    },
                    summary: {
                        totalBeacons: pageLoadBeacons.beacons.length + 
                                    (interactionBeacons?.beacons?.length || 0),
                        providers: pageLoadBeacons.summary.providers
                    }
                };
                
                // Add interaction data if available
                if (interactionBeacons) {
                    if (interactionBeacons.error) {
                        result.interaction = {
                            error: interactionBeacons.error,
                            selector: simulateClick
                        };
                    } else {
                        result.interaction = {
                            beaconCount: interactionBeacons.beacons.length,
                            selector: simulateClick,
                            beacons: interactionBeacons.beacons
                        };
                        
                        // Update providers in summary
                        if (interactionBeacons.summary?.providers) {
                            for (const [provider, count] of Object.entries(interactionBeacons.summary.providers)) {
                                if (result.summary.providers[provider]) {
                                    result.summary.providers[provider] += count;
                                } else {
                                    result.summary.providers[provider] = count;
                                }
                            }
                        }
                    }
                }
                
                // Group by beacon type for easier analysis
                const groupedBeacons = {
                    adobe_analytics: [],
                    adobe_experience_platform: [],
                    other_analytics: []
                };
                
                // Process all beacons into their categories
                const allBeacons = [
                    ...pageLoadBeacons.beacons,
                    ...(interactionBeacons?.beacons || [])
                ];
                
                for (const beacon of allBeacons) {
                    if (beacon.providerKey === 'ADOBEANALYTICS') {
                        groupedBeacons.adobe_analytics.push(beacon);
                    } else if (beacon.providerKey === 'ADOBEWEBSDK') {
                        groupedBeacons.adobe_experience_platform.push(beacon);
                    } else {
                        groupedBeacons.other_analytics.push(beacon);
                    }
                }
                
                result.groupedBeacons = groupedBeacons;
                
                // Extract key variables for Adobe Analytics for easier analysis
                if (groupedBeacons.adobe_analytics.length > 0) {
                    const aaVariables = extractAdobeAnalyticsVariables(groupedBeacons.adobe_analytics);
                    result.adobeAnalyticsVariables = aaVariables;
                }
                
                // Extract XDM data for Adobe Experience Platform
                if (groupedBeacons.adobe_experience_platform.length > 0) {
                    const xdmData = extractXdmData(groupedBeacons.adobe_experience_platform);
                    result.xdmData = xdmData;
                }
                
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: "text",
                        text: `Error parsing analytics beacons: ${error.message}`
                    }],
                    isError: true
                };
            }
        }
    );
}

/**
 * Extract key variables from Adobe Analytics beacons for easier analysis
 * 
 * @param {Array} beacons - Array of Adobe Analytics beacons
 * @returns {Object} Extracted variables organized by beacon
 */
function extractAdobeAnalyticsVariables(beacons) {
    const results = [];
    
    for (const beacon of beacons) {
        const variables = {
            requestType: beacon.requestType || 'Unknown',
            timestamp: beacon.timestamp,
            rsid: null,
            pageName: null,
            events: null,
            products: null,
            eVars: {},
            props: {},
            listVars: {},
            contextData: {},
            other: {}
        };
        
        // Process each data item from the beacon
        for (const item of beacon.parsedData) {
            const { key, field, value, group } = item;
            
            if (key === 'rsid') {
                variables.rsid = value;
            } else if (key === 'pageName') {
                variables.pageName = value;
            } else if (key === 'events') {
                variables.events = value;
            } else if (key === 'products') {
                variables.products = value;
            } else if (/^eVar\d+$/.test(field) || /^v\d+$/.test(key)) {
                // Match both eVar patterns
                const eVarMatch = field.match(/^eVar(\d+)$/) || key.match(/^v(\d+)$/);
                if (eVarMatch) {
                    const eVarNum = eVarMatch[1];
                    variables.eVars[`eVar${eVarNum}`] = value;
                }
            } else if (/^prop\d+$/.test(field) || /^c\d+$/.test(key)) {
                // Match both prop patterns
                const propMatch = field.match(/^prop(\d+)$/) || key.match(/^c(\d+)$/);
                if (propMatch) {
                    const propNum = propMatch[1];
                    variables.props[`prop${propNum}`] = value;
                }
            } else if (/^List Var \d+$/.test(field) || /^l\d+$/.test(key)) {
                // Match list variable patterns
                const listMatch = field.match(/^List Var (\d+)$/) || key.match(/^l(\d+)$/);
                if (listMatch) {
                    const listNum = listMatch[1];
                    variables.listVars[`list${listNum}`] = value;
                }
            } else if (group === 'context' || key.includes('.')) {
                // Handle context data variables
                const contextKey = field.replace('c.', '');
                variables.contextData[contextKey] = value;
            } else if (['pageName', 'rsid', 'events', 'products'].indexOf(key) === -1) {
                // Add all other variables to the "other" category
                variables.other[field] = value;
            }
        }
        
        results.push(variables);
    }
    
    return results;
}

/**
 * Extract XDM data from Adobe Experience Platform beacons
 * 
 * @param {Array} beacons - Array of AEP beacons
 * @returns {Array} Extracted XDM data organized by beacon
 */
function extractXdmData(beacons) {
    const results = [];
    
    for (const beacon of beacons) {
        const xdmData = {
            timestamp: beacon.timestamp,
            endpoint: beacon.parsedData.find(item => item.key === 'endpoint')?.value,
            categories: {
                identity: [],
                target: [],
                analytics: [],
                general: [],
                other: []
            }
        };
        
        // Process all data items from the beacon
        for (const item of beacon.parsedData) {
            // Skip endpoint as we've already captured it
            if (item.key === 'endpoint') continue;
            
            // Skip hidden items
            if (item.hidden) continue;
            
            // Create a simplified data item
            const dataItem = {
                key: item.key,
                field: item.field,
                value: item.value
            };
            
            // Add to the appropriate category
            switch (item.group) {
                case 'identity':
                    xdmData.categories.identity.push(dataItem);
                    break;
                case 'target':
                    xdmData.categories.target.push(dataItem);
                    break;
                case 'analytics':
                    xdmData.categories.analytics.push(dataItem);
                    break;
                case 'general':
                    xdmData.categories.general.push(dataItem);
                    break;
                default:
                    xdmData.categories.other.push(dataItem);
            }
        }
        
        results.push(xdmData);
    }
    
    return results;
}
