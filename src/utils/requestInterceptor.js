/**
 * Utility for intercepting and analyzing network requests
 */

/**
 * Sets up request interception on a Puppeteer page
 * @param {Page} page - Puppeteer page object
 * @returns {Promise<Array>} Array to collect requests
 */
async function setupRequestInterception(page) {
  const requests = [];
  
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers(),
      time: Date.now()
    });
    
    request.continue();
  });
  
  page.on('response', response => {
    const request = requests.find(req => req.url === response.url());
    if (request) {
      request.status = response.status();
      request.responseHeaders = response.headers();
      request.responseTime = Date.now();
      request.timing = request.responseTime - request.time;
    }
  });
  
  return requests;
}

/**
 * Filters requests to find those related to marketing/analytics
 * @param {Array} requests - Array of intercepted requests
 * @returns {Array} Filtered array of marketing-related requests
 */
function filterMarketingRequests(requests) {
  const marketingDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'facebook.com/tr',
    'connect.facebook.net',
    'analytics.tiktok.com',
    'clarity.ms',
    'bing.com/uet',
    't.co/i/adsct',
    'ads-twitter.com',
    'analytics.twitter.com',
    'platform.linkedin.com',
    'pinterest.com/ct',
    'sc-static.net',
    'contentsquare.net',
    'hotjar.com',
    'clicktale.net',
    'demdex.net',
    'omtrdc.net',
    'adobedtm.com',
    'segment.io',
    'segment.com',
    'cdn.evgnet.com',  // Salesforce Marketing Cloud
    'js.hs-scripts.com', // HubSpot
    'snap.licdn.com', // LinkedIn
    'px.ads.linkedin.com', // LinkedIn
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
    'c.lytics.io' // Lytics
  ];
  
  const marketingPaths = [
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
    '/event'
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