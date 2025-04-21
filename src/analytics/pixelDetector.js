/**
 * Module for detecting marketing and analytics pixels on webpages
 */

/**
 * Analyzes the page to detect common marketing pixels and tags
 * @param {Page} page - Puppeteer page object
 * @returns {Object} Results of the pixel analysis
 */
async function detectMarketingPixels(page) {
  // Execute browser script to detect pixels
  return await page.evaluate(() => {
    // Utility function to safely check for a global variable
    function hasGlobalVar(varName) {
      try {
        return typeof window[varName] !== 'undefined';
      } catch (e) {
        return false;
      }
    }
    
    // Result object to store all detected technologies
    const results = {
      technologies: [],
      pixelIds: {},
      dataLayerSample: null
    };
    
    // Helper to add detected technology
    function addTech(name, vendor, category, confidence, evidence) {
      results.technologies.push({
        name,
        vendor,
        category,
        confidence,
        evidence
      });
    }
    
    // GOOGLE PRODUCTS
    
    // Google Tag Manager
    if (hasGlobalVar('dataLayer')) {
      addTech(
        'Google Tag Manager',
        'Google',
        'Tag Management',
        'high',
        'dataLayer global object present'
      );
      
      // Sample the dataLayer for inspection
      if (window.dataLayer && window.dataLayer.length > 0) {
        results.dataLayerSample = window.dataLayer.slice(0, 5);
      }
    }
    
    // Google Analytics 4
    if (hasGlobalVar('gtag')) {
      addTech(
        'Google Analytics 4',
        'Google',
        'Analytics',
        'high',
        'gtag global object present'
      );
    }
    
    // Universal Analytics
    if (hasGlobalVar('ga') || hasGlobalVar('_ga') || hasGlobalVar('GoogleAnalyticsObject')) {
      addTech(
        'Universal Analytics',
        'Google',
        'Analytics',
        'high',
        'ga global object present'
      );
    }
    
    // FACEBOOK / META
    
    // Facebook Pixel
    if (hasGlobalVar('fbq') || hasGlobalVar('_fbq')) {
      addTech(
        'Facebook Pixel',
        'Meta',
        'Advertising',
        'high',
        'fbq global object present'
      );
      
      // Try to extract the Facebook Pixel ID
      try {
        if (typeof fbq.getState === 'function') {
          const fbState = fbq.getState();
          if (fbState && fbState.pixelConfigs && fbState.pixelConfigs.length > 0) {
            results.pixelIds.facebook = fbState.pixelConfigs.map(p => p.id);
          }
        }
      } catch (e) {
        // Unable to extract Facebook Pixel ID
      }
    }
    
    // TIKTOK
    
    // TikTok Pixel
    if (hasGlobalVar('ttq')) {
      addTech(
        'TikTok Pixel',
        'TikTok',
        'Advertising',
        'high',
        'ttq global object present'
      );
    }
    
    // ADOBE
    
    // Adobe Analytics
    if (hasGlobalVar('s') && typeof window.s === 'object') {
      addTech(
        'Adobe Analytics',
        'Adobe',
        'Analytics',
        'high',
        's global object present'
      );
    }
    
    // Adobe Launch/DTM
    if (hasGlobalVar('_satellite')) {
      addTech(
        'Adobe Launch/DTM',
        'Adobe',
        'Tag Management',
        'high',
        '_satellite global object present'
      );
    }
    
    // MARKETING AUTOMATION
    
    // HubSpot
    if (hasGlobalVar('_hsq')) {
      addTech(
        'HubSpot',
        'HubSpot',
        'Marketing Automation',
        'high',
        '_hsq global object present'
      );
    }
    
    // Marketo
    if (hasGlobalVar('Munchkin') || document.querySelector('script[src*="munchkin.js"]')) {
      addTech(
        'Marketo',
        'Adobe',
        'Marketing Automation',
        'high',
        'Munchkin global object or script present'
      );
    }
    
    // HEATMAPS & BEHAVIOR
    
    // Hotjar
    if (hasGlobalVar('hj') || hasGlobalVar('_hjSettings')) {
      addTech(
        'Hotjar',
        'Hotjar',
        'Analytics',
        'high',
        'hj global object present'
      );
    }
    
    // OTHERS
    
    // Segment
    if (hasGlobalVar('analytics') && typeof window.analytics === 'object') {
      addTech(
        'Segment',
        'Segment',
        'Customer Data Platform',
        'high',
        'analytics global object present'
      );
    }
    
    // Pinterest Tag
    if (hasGlobalVar('pintrk')) {
      addTech(
        'Pinterest Tag',
        'Pinterest',
        'Advertising',
        'high',
        'pintrk global object present'
      );
    }
    
    // Twitter/X Pixel
    if (hasGlobalVar('twq')) {
      addTech(
        'Twitter Pixel',
        'Twitter/X',
        'Advertising',
        'high',
        'twq global object present'
      );
    }
    
    // LinkedIn Insight Tag
    if (hasGlobalVar('_linkedin_data_partner_ids')) {
      addTech(
        'LinkedIn Insight Tag',
        'LinkedIn',
        'Advertising',
        'high',
        '_linkedin_data_partner_ids global object present'
      );
    }
    
    // Microsoft Clarity
    if (hasGlobalVar('clarity')) {
      addTech(
        'Microsoft Clarity',
        'Microsoft',
        'Analytics',
        'high',
        'clarity global object present'
      );
    }
    
    // Salesforce Marketing Cloud
    if (document.querySelector('script[src*="cdn.evgnet.com"]')) {
      addTech(
        'Salesforce Marketing Cloud',
        'Salesforce',
        'Marketing Automation',
        'high',
        'Salesforce Marketing Cloud script detected'
      );
    }
    
    // Extract IDs from scripts
    const scripts = Array.from(document.scripts);
    
    for (const script of scripts) {
      const src = script.src || '';
      const content = script.innerHTML || '';
      
      // Google Tag Manager ID
      const gtmMatch = content.match(/GTM-([A-Z0-9]+)/);
      if (gtmMatch) {
        results.pixelIds.gtm = 'GTM-' + gtmMatch[1];
      }
      
      // Google Analytics 4 ID
      const ga4Match = content.match(/G-([A-Z0-9]+)/);
      if (ga4Match) {
        results.pixelIds.ga4 = 'G-' + ga4Match[1];
      }
      
      // Universal Analytics ID
      const uaMatch = content.match(/UA-([0-9]+-[0-9]+)/);
      if (uaMatch) {
        results.pixelIds.ua = 'UA-' + uaMatch[1];
      }
      
      // Facebook Pixel ID from script
      const fbMatch = content.match(/fbq\(['"]init['"], ?['"]([0-9]+)['"]/);
      if (fbMatch && fbMatch[1] && !results.pixelIds.facebook) {
        results.pixelIds.facebook = [fbMatch[1]];
      }
      
      // TikTok Pixel ID from script src
      if (src.includes('analytics.tiktok.com')) {
        const ttMatch = src.match(/sdkid=([A-Z0-9]+)/);
        if (ttMatch && ttMatch[1]) {
          results.pixelIds.tiktok = ttMatch[1];
        }
      }
    }
    
    return results;
  });
}

/**
 * Analyzes network requests to identify analytics and marketing beacons
 * @param {Array} requests - Array of captured network requests
 * @returns {Object} Analysis of marketing-related requests
 */
function analyzeNetworkRequests(requests) {
  const marketingRequests = [];
  const beaconsByVendor = {
    google: [],
    facebook: [],
    tiktok: [],
    twitter: [],
    adobe: [],
    microsoft: [],
    pinterest: [],
    linkedin: [],
    other: []
  };
  
  for (const request of requests) {
    const url = request.url;
    
    // Helper to add a request to the appropriate category
    function addBeacon(vendor) {
      beaconsByVendor[vendor].push({
        url: url,
        method: request.method,
        type: request.resourceType,
        time: request.time,
        headers: request.headers
      });
      
      marketingRequests.push({
        vendor,
        url,
        method: request.method,
        type: request.resourceType
      });
    }
    
    // Categorize requests by vendor
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com')) {
      addBeacon('google');
    } else if (url.includes('facebook.com/tr') || url.includes('facebook.net')) {
      addBeacon('facebook');
    } else if (url.includes('analytics.tiktok.com')) {
      addBeacon('tiktok');
    } else if (url.includes('platform.twitter.com') || url.includes('t.co/i/adsct')) {
      addBeacon('twitter');
    } else if (
      url.includes('demdex.net') || 
      url.includes('omtrdc.net') || 
      url.includes('adobedtm.com')
    ) {
      addBeacon('adobe');
    } else if (url.includes('clarity.ms') || url.includes('bing.com')) {
      addBeacon('microsoft');
    } else if (url.includes('pinterest.com/ct')) {
      addBeacon('pinterest');
    } else if (url.includes('linkedin.com/px')) {
      addBeacon('linkedin');
    } else if (
      url.includes('analytics') || 
      url.includes('pixel') || 
      url.includes('tracking') || 
      url.includes('beacon') || 
      url.includes('collect') ||
      url.includes('metrics')
    ) {
      addBeacon('other');
    }
  }
  
  return {
    marketingRequests,
    beaconsByVendor,
    totalTrackers: marketingRequests.length
  };
}

export {
  detectMarketingPixels,
  analyzeNetworkRequests
};