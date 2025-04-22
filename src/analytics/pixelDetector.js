/**
 * Module for detecting marketing and analytics pixels on webpages
 * Enhanced with improved Adobe Experience Cloud detection
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
    
    // Check if a variable is a non-empty object
    function isNonEmptyObject(obj) {
      return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
    }
    
    // Result object to store all detected technologies
    const results = {
      technologies: [],
      pixelIds: {},
      dataLayerSample: null
    };
    
    // Helper to add detected technology
    function addTech(name, vendor, category, confidence, evidence) {
      // Check if this technology is already added to avoid duplicates
      const alreadyExists = results.technologies.some(tech => 
        tech.name === name && tech.vendor === vendor
      );
      
      if (!alreadyExists) {
        results.technologies.push({
          name,
          vendor,
          category,
          confidence,
          evidence
        });
      }
    }
    
    // ----- GOOGLE PRODUCTS -----
    
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
    
    // ----- FACEBOOK / META -----
    
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
        if (typeof fbq?.getState === 'function') {
          const fbState = fbq.getState();
          if (fbState && fbState.pixelConfigs && fbState.pixelConfigs.length > 0) {
            results.pixelIds.facebook = fbState.pixelConfigs.map(p => p.id);
          }
        }
      } catch (e) {
        // Unable to extract Facebook Pixel ID
      }
    }
    
    // ----- TIKTOK -----
    
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
    
    // ----- ADOBE EXPERIENCE CLOUD -----
    
    // Adobe Analytics (AppMeasurement)
    if (hasGlobalVar('s') && typeof window.s === 'object') {
      addTech(
        'Adobe Analytics',
        'Adobe',
        'Analytics',
        'high',
        's global object present'
      );
      
      // Try to extract Adobe Analytics information
      try {
        if (window.s.version) {
          results.pixelIds.adobeAnalytics = window.s.version;
        }
        
        if (window.s.account) {
          results.pixelIds.adobeReportSuite = window.s.account;
        }
      } catch (e) {
        // Unable to extract Adobe Analytics details
      }
    }
    
    // Adobe Launch / Experience Platform Launch (DTM replacement)
    if (hasGlobalVar('_satellite')) {
      addTech(
        'Adobe Experience Platform Launch',
        'Adobe',
        'Tag Management',
        'high',
        '_satellite global object present'
      );
    }
    
    // Adobe Target (formerly Test&Target)
    const targetGlobals = ['adobe', 'mboxCreate', 'mboxDefine', 'mboxUpdate', 'targetPageParams', 'targetPageParamsAll'];
    for (const global of targetGlobals) {
      if (hasGlobalVar(global)) {
        addTech(
          'Adobe Target',
          'Adobe',
          'Experimentation',
          'high',
          `${global} global object present`
        );
        break;
      }
    }
    
    // Adobe Audience Manager
    if (hasGlobalVar('DIL') || (hasGlobalVar('Visitor') && typeof window.Visitor?.getInstance === 'function')) {
      addTech(
        'Adobe Audience Manager',
        'Adobe',
        'Customer Data Platform',
        'high',
        'DIL or Visitor global object present'
      );
    }
    
    // Adobe Experience Cloud ID Service
    if (hasGlobalVar('Visitor') && typeof window.Visitor?.getInstance === 'function') {
      addTech(
        'Adobe Experience Cloud ID Service',
        'Adobe',
        'Customer Data Platform',
        'high',
        'Visitor.getInstance() function present'
      );
      
      // Try to extract ECID
      try {
        const visitorInstance = window.Visitor.getInstance();
        if (visitorInstance && typeof visitorInstance.getMarketingCloudVisitorID === 'function') {
          const mcid = visitorInstance.getMarketingCloudVisitorID();
          if (mcid) {
            results.pixelIds.adobeEcid = mcid;
          }
        }
      } catch (e) {
        // Unable to extract ECID
      }
    }
    
    // Adobe Experience Manager
    if (hasGlobalVar('AdobeLibrarySettings') || document.querySelector('meta[content*="adobe experience manager"]')) {
      addTech(
        'Adobe Experience Manager',
        'Adobe',
        'Content Management',
        'high',
        'AEM markers detected'
      );
    }
    
    // ----- MARKETING AUTOMATION -----
    
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
    
    // Marketo (Adobe)
    if (hasGlobalVar('Munchkin') || document.querySelector('script[src*="munchkin.js"]')) {
      addTech(
        'Marketo',
        'Adobe',
        'Marketing Automation',
        'high',
        'Munchkin global object or script present'
      );
    }
    
    // ----- HEATMAPS & BEHAVIOR -----
    
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
    
    // ----- OTHERS -----
    
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
    
    // ----- SCRIPT CONTENT ANALYSIS -----
    
    // Extract IDs and additional tools from scripts
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
      
      // Adobe Launch / DTM detection
      if (src.includes('assets.adobedtm.com') || src.includes('launch') || src.includes('/satelliteLib-')) {
        addTech(
          'Adobe Experience Platform Launch',
          'Adobe',
          'Tag Management',
          'high',
          'Adobe Launch script detected'
        );
      }
      
      // Adobe Analytics detection (AppMeasurement)
      if (content.includes('AppMeasurement') || src.includes('AppMeasurement')) {
        addTech(
          'Adobe Analytics',
          'Adobe',
          'Analytics',
          'high',
          'AppMeasurement script detected'
        );
      }
      
      // Adobe Target detection
      if (src.includes('mbox.js') || src.includes('at.js') || src.includes('target') || 
          content.includes('mboxCreate') || content.includes('adobe.target')) {
        addTech(
          'Adobe Target',
          'Adobe',
          'Experimentation',
          'high',
          'Adobe Target script detected'
        );
      }
      
      // Adobe Audience Manager detection
      if (src.includes('demdex') || content.includes('Visitor') || content.includes('demdex')) {
        addTech(
          'Adobe Audience Manager',
          'Adobe',
          'Customer Data Platform',
          'high',
          'Adobe Audience Manager script detected'
        );
      }
    }
    
    // ----- CUSTOM DOMAIN PATTERN DETECTION -----
    
    // Check for scripts from domains that may be custom implementations
    // This helps with sites like Home Depot that use custom CDNs
    const scriptSources = Array.from(document.scripts).map(script => script.src).filter(Boolean);
    
    // Check for common patterns in CDN URLs
    for (const src of scriptSources) {
      try {
        const url = new URL(src);
        
        // Common CDN patterns
        if (url.hostname.includes('assets') || url.hostname.includes('cdn') || url.hostname.includes('static')) {
          // Adobe-like scripts in custom CDNs
          if (
            src.includes('/analytics/') || 
            src.includes('/s_code.') || 
            src.includes('/AppMeasurement') || 
            src.includes('/satelliteLib') ||
            src.includes('/launch/') ||
            src.includes('/mbox/') ||
            src.includes('/at.js') ||
            src.includes('/visitor/') ||
            src.includes('/core.js') ||
            src.includes('/sync.js')
          ) {
            if (!results.technologies.some(tech => tech.vendor === 'Adobe')) {
              addTech(
                'Adobe Experience Cloud',
                'Adobe',
                'Analytics',
                'medium',
                `Script detected from custom CDN: ${url.hostname}`
              );
            }
          }
        }
      } catch (e) {
        // Skip invalid URLs
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
        resourceType: request.resourceType,
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
    // Google
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com') || 
        url.includes('doubleclick.net') || url.includes('googlesyndication.com')) {
      addBeacon('google');
    } 
    // Facebook
    else if (url.includes('facebook.com/tr') || url.includes('connect.facebook.net') || 
            url.includes('fbcdn.net')) {
      addBeacon('facebook');
    } 
    // TikTok
    else if (url.includes('analytics.tiktok.com') || url.includes('tiktokcdn.com')) {
      addBeacon('tiktok');
    } 
    // Twitter
    else if (url.includes('platform.twitter.com') || url.includes('t.co/i/adsct') || 
            url.includes('ads-twitter.com') || url.includes('analytics.twitter.com')) {
      addBeacon('twitter');
    } 
    // Adobe
    else if (url.includes('demdex.net') || url.includes('omtrdc.net') || 
            url.includes('adobedtm.com') || url.includes('adobe.com') || 
            url.includes('2o7.net') || url.includes('adobedc.net') || 
            url.includes('everesttech.net') || url.includes('adobe.io') ||
            url.includes('scene7.com') || url.includes('marketo.net') || 
            /\/at\.js|AppMeasurement|mbox|visitor|demdex|target-|launch\//.test(url)) {
      addBeacon('adobe');
    } 
    // Microsoft
    else if (url.includes('clarity.ms') || url.includes('bing.com') || 
            url.includes('microsoftonline.com')) {
      addBeacon('microsoft');
    } 
    // Pinterest
    else if (url.includes('pinterest.com/ct') || url.includes('pinimg.com')) {
      addBeacon('pinterest');
    } 
    // LinkedIn
    else if (url.includes('linkedin.com/px') || url.includes('licdn.com') || 
            url.includes('snap.licdn.com')) {
      addBeacon('linkedin');
    } 
    // Generic analytics/pixel patterns
    else if (url.includes('analytics') || url.includes('pixel') || 
            url.includes('tracking') || url.includes('beacon') || 
            url.includes('collect') || url.includes('metrics') || 
            url.includes('telemetry') || url.includes('stats') || 
            url.includes('/tr/') || url.includes('/t.gif') || 
            url.includes('/p.gif') || url.includes('/1.gif') || 
            url.includes('/track/') || url.includes('/tag/')) {
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