/**
 * Utility for intercepting and analyzing network requests
 * Updated version with improved handling for request interception conflicts
 */

// Symbol to track if a page has been set up for interception
const INTERCEPTION_SETUP = Symbol('request-interception-setup');

/**
 * Sets up request interception on a Puppeteer page with conflict prevention
 * @param {Page} page - Puppeteer page object
 * @param {Object} options - Interception options
 * @returns {Promise<Array>} Array to collect requests
 */
async function setupRequestInterception(page, options = {}) {
  const requests = [];
  const blockResources = options.blockResources || [];
  
  // Check if this page already has interception set up
  if (page[INTERCEPTION_SETUP]) {
    // If already set up, just return the existing requests array to avoid conflicts
    console.error('Request interception already set up for this page, reusing existing configuration');
    return requests;
  }
  
  try {
    // Remove any existing request listeners to prevent conflicts
    // Note: This uses a private Puppeteer API that might change in future versions
    const listeners = page['_events']?.request || [];
    if (Array.isArray(listeners) && listeners.length > 0) {
      console.error(`Removing ${listeners.length} existing request listeners to prevent conflicts`);
      page.removeAllListeners('request');
    }
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Mark this page as having interception set up
    page[INTERCEPTION_SETUP] = true;
    
    // Create a single request handler that will be used for all requests
    const requestHandler = (request) => {
      try {
        // Skip blocked resource types for faster loading
        if (blockResources.includes(request.resourceType())) {
          request.abort().catch(e => {
            // Suppress abort errors - they're usually because the request was already handled
          });
          return;
        }
        
        // Store request data for analysis
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          headers: request.headers(),
          time: Date.now()
        });
        
        // Continue the request if not already handled
        if (!request.response() && !request.redirectChain().length) {
          request.continue().catch(e => {
            // Suppress continue errors - they're usually because the request was already handled
          });
        }
      } catch (error) {
        // If any error happens, try to continue the request as a fallback
        // but don't log all the individual errors to reduce console noise
        try {
          request.continue().catch(() => {
            // Suppress errors
          });
        } catch (innerError) {
          // Suppress errors
        }
      }
    };
    
    // Add the page handler
    page.on('request', requestHandler);
    
    // Clean up handler when page is closed
    page.once('close', () => {
      page.removeListener('request', requestHandler);
      delete page[INTERCEPTION_SETUP];
    });
    
    // Add response handler to capture response data
    page.on('response', response => {
      try {
        const request = requests.find(req => req.url === response.url());
        if (request) {
          request.status = response.status();
          request.responseHeaders = response.headers();
          request.responseTime = Date.now();
          request.timing = request.responseTime - request.time;
        }
      } catch (error) {
        // Suppress errors in response handling
      }
    });
    
    return requests;
  } catch (error) {
    console.error(`Error setting up request interception: ${error.message}`);
    // Continue without interception rather than failing
    return requests;
  }
}

/**
 * Filters requests to find those related to marketing/analytics
 * @param {Array} requests - Array of intercepted requests
 * @returns {Array} Filtered array of marketing-related requests
 */
function filterMarketingRequests(requests) {
  const marketingDomains = [
    // Google
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'googlesyndication.com',
    
    // Facebook/Meta
    'facebook.com/tr',
    'connect.facebook.net',
    'fbcdn.net',
    
    // TikTok
    'analytics.tiktok.com',
    'tiktokcdn.com',
    
    // Twitter/X
    'platform.twitter.com',
    't.co/i/adsct',
    'ads-twitter.com',
    'analytics.twitter.com',
    
    // Adobe (expanded)
    'demdex.net',
    'omtrdc.net',
    'adobedtm.com',
    'adobe.com',
    '2o7.net',
    'adobedc.net',
    'everesttech.net',
    'adobe.io',
    'scene7.com',
    'marketo.net',
    'typekit.net',
    
    // Microsoft
    'clarity.ms',
    'bing.com',
    'microsoftonline.com',
    
    // Pinterest
    'pinterest.com/ct',
    'pinimg.com',
    
    // LinkedIn
    'platform.linkedin.com',
    'linkedin.com/px',
    'licdn.com',
    'snap.licdn.com',
    'px.ads.linkedin.com',
    
    // Other Analytics/Marketing
    'sc-static.net',
    'contentsquare.net',
    'hotjar.com',
    'clicktale.net',
    'segment.io',
    'segment.com',
    'cdn.evgnet.com',  // Salesforce Marketing Cloud
    'js.hs-scripts.com', // HubSpot
    'bat.bing.com', // Microsoft Advertising
    'analytics.amplitude.com', // Amplitude
    'googleoptimize.com',
    'ad.doubleclick.net',
    'online-metrix.net', // ThreatMetrix
    'optimizely.com',
    'cloudfront.net/atrk.js', // Alexa
    'static.ads-twitter.com', // Twitter Ads
    'cdn.mouseflow.com', // Mouseflow
    'app.link', // Branch.io
    'c.lytics.io', // Lytics
    'cxense.com', // Piano
    'chartbeat.com', // Chartbeat
    'crazyegg.com', // Crazy Egg
    'krxd.net', // Salesforce Krux
    'quantserve.com', // Quantcast
    'cdn.taboola.com', // Taboola
    'cdn.speedcurve.com', // SpeedCurve
    'assets.adobedtm.com' // Adobe DTM
  ];
  
  const marketingPaths = [
    // General analytics paths
    '/collect',
    '/analytics',
    '/pixel',
    '/beacon',
    '/track',
    '/tr',
    '/stats',
    '/metrics',
    '/piwik.php',
    '/matomo.php',
    '/ping',
    '/pageview',
    '/event',
    
    // Adobe specific paths
    '/b/ss/', // Adobe Analytics collection server
    '/id', // Adobe ECID service
    '/mbox', // Adobe Target
    '/demconf.jpg', // Adobe Audience Manager
    '/dest', // Adobe destination publishing
    '/js/launch', // Experience Platform Launch
    '/AppMeasurement', // Adobe Analytics library
    '/at.js', // Adobe Target library
    '/satelliteLib', // Adobe Launch/DTM
    '/dpm', // Adobe data provider match
    
    // Additional tracking patterns
    '/tracking',
    '/telemetry',
    '/rum', // Real user monitoring
    '/p.gif', // Common tracking pixel pattern
    '/1.gif', // Common tracking pixel pattern
    '/t.gif', // Common tracking pixel pattern
    '/c.gif', // Common tracking pixel pattern
    '/i.gif' // Common tracking pixel pattern
  ];
  
  return requests.filter(request => {
    try {
      const url = new URL(request.url);
      
      // Check if domain matches known marketing domains
      const domainMatch = marketingDomains.some(domain => 
        url.hostname.includes(domain)
      );
      
      if (domainMatch) {
        return true;
      }
      
      // Check if path matches known marketing paths
      const pathMatch = marketingPaths.some(path => 
        url.pathname.includes(path)
      );
      
      if (pathMatch) {
        return true;
      }
      
      // Check URL parameters for marketing indicators
      for (const [key, value] of url.searchParams.entries()) {
        const paramKey = key.toLowerCase();
        if (
          paramKey.includes('tracking') ||
          paramKey.includes('utm_') ||
          paramKey.includes('pixel') ||
          paramKey.includes('event') ||
          paramKey.includes('analytics')
        ) {
          return true;
        }
      }
      
      return false;
    } catch (e) {
      // If URL parsing fails, skip this request
      return false;
    }
  });
}

export {
  setupRequestInterception,
  filterMarketingRequests
};