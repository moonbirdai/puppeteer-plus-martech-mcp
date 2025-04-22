#!/usr/bin/env node

/**
 * Test script for provider-based marketing technology detection
 * Tests the enhanced Omnibug-inspired provider system
 */

import providerRegistry from './src/providers/index.js';
import https from 'https';
import http from 'http';

// Test URLs to check against providers
const testUrls = [
    // Google Analytics 4
    'https://www.google-analytics.com/g/collect?v=2&tid=G-12345&cid=555&en=page_view',
    
    // Universal Analytics
    'https://www.google-analytics.com/collect?v=1&tid=UA-12345-1&cid=555&t=pageview',
    
    // Adobe Analytics
    'https://metrics.example.com/b/ss/rsid1/1/JS-2.22.0/s43324?AQB=1&ndh=1&t=12/4/2024 13:30:5 6 -480&pageName=home%20page&g=https://www.example.com/',
    
    // Facebook Pixel
    'https://www.facebook.com/tr/?id=12345678901&ev=PageView&dl=https://www.example.com/',
    
    // Google Tag Manager
    'https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXX',
    
    // Adobe Launch
    'https://assets.adobedtm.com/launch-EN12345678901234567890123456789012345678901234.min.js',
    
    // TikTok
    'https://analytics.tiktok.com/i18n/pixel/events?sdkid=12345678901234567890&event=PageView',
    
    // Pinterest
    'https://ct.pinterest.com/v3/user/?tid=123456789012&event=pagevisit',
    
    // LinkedIn
    'https://px.ads.linkedin.com/collect?pid=123456&fmt=gif&url=https://www.example.com/',
    
    // Twitter
    'https://analytics.twitter.com/i/adsct?txn_id=12345&p_id=Twitter',
    
    // Microsoft Clarity
    'https://www.clarity.ms/tag/123456789012'
];

console.log("\n=== Testing Provider Detection ===\n");

// Test each URL
testUrls.forEach(url => {
    const matchedProviders = providerRegistry.getMatchingProviders(url);
    
    console.log(`URL: ${url}`);
    
    if (matchedProviders.length === 0) {
        console.log("❌ No matching providers found");
    } else {
        console.log(`✅ Detected ${matchedProviders.length} matching providers:`);
        matchedProviders.forEach(provider => {
            console.log(`  - ${provider.name} (${provider.type})`);
            
            // Try parsing the URL
            try {
                const parsed = provider.parseUrl(url);
                const accountField = parsed.data.find(item => 
                    Object.values(provider.columnMapping).includes(item.key)
                );
                
                if (accountField) {
                    console.log(`    ${accountField.field}: ${accountField.value}`);
                }
                
                console.log(`    Total data fields: ${parsed.data.length}`);
            } catch (e) {
                console.log(`    Error parsing URL: ${e.message}`);
            }
        });
    }
    
    console.log('');
});

// Test a real website
if (process.argv.includes('--live')) {
    console.log("\n=== Testing Live Website Detection ===\n");
    
    const testSite = process.argv[process.argv.indexOf('--live') + 1] || 'https://www.nytimes.com/';
    
    console.log(`Fetching: ${testSite}`);
    
    // Simple HTTP/HTTPS request function without requiring external packages
    // Now with redirect handling
    function fetchUrl(url, maxRedirects = 5) {
        return new Promise((resolve, reject) => {
            if (maxRedirects <= 0) {
                return reject(new Error('Too many redirects'));
            }
            
            const options = new URL(url);
            const client = options.protocol === 'https:' ? https : http;
            
            client.get(url, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    console.log(`Following redirect to: ${res.headers.location}`);
                    return fetchUrl(res.headers.location, maxRedirects - 1)
                        .then(resolve)
                        .catch(reject);
                }
                
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`Status Code: ${res.statusCode}`));
                }
                
                const data = [];
                
                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                
                res.on('end', () => {
                    resolve(Buffer.concat(data).toString());
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }
    
    // Execute the test
    fetchUrl(testSite)
        .then(html => {
            // Extract URLs from the HTML
            const urlRegex = /https?:\/\/[^"'>\s)]+/g;
            const matches = html.match(urlRegex) || [];
            
            // Deduplicate URLs
            const uniqueUrls = [...new Set(matches)];
            
            console.log(`Found ${uniqueUrls.length} unique URLs`);
            
            // Check each URL against providers
            const detectedTech = {};
            
            uniqueUrls.forEach(url => {
                const matchedProviders = providerRegistry.getMatchingProviders(url);
                
                matchedProviders.forEach(provider => {
                    if (!detectedTech[provider.key]) {
                        detectedTech[provider.key] = {
                            name: provider.name,
                            type: provider.type,
                            count: 0,
                            urls: []
                        };
                    }
                    
                    detectedTech[provider.key].count++;
                    if (detectedTech[provider.key].urls.length < 2) {  // Limit to 2 example URLs
                        detectedTech[provider.key].urls.push(url);
                    }
                });
            });
            
            // Display results
            console.log("\nDetected Marketing Technologies:");
            
            if (Object.keys(detectedTech).length === 0) {
                console.log("No marketing technologies detected");
            } else {
                Object.values(detectedTech).forEach(tech => {
                    console.log(`- ${tech.name} (${tech.type}): ${tech.count} request(s)`);
                    console.log(`  Example: ${tech.urls[0]}`);
                });
            }
        })
        .catch(err => {
            console.error(`Error fetching ${testSite}:`, err.message);
        });
}

console.log("\nProvider testing complete");
