/**
 * Main module for comprehensive page analysis
 */

import { detectMarketingPixels, analyzeNetworkRequests } from './analytics/pixelDetector.js';
import { analyzeSeoMetadata, analyzeUrl } from './seo/metadataAnalyzer.js';
import { setupRequestInterception, filterMarketingRequests } from './utils/requestInterceptor.js';

/**
 * Performs a comprehensive analysis of marketing technologies and SEO elements
 * @param {Page} page - Puppeteer page object
 * @param {string} url - URL of the page being analyzed
 * @param {Object} options - Analysis options
 * @returns {Object} Comprehensive analysis results
 */
async function analyzeMarketingTech(page, url, options = {}) {
  // Setup request interception to capture network activity
  const requests = await setupRequestInterception(page);
  
  // Navigate to the URL and wait for network to be idle
  await page.goto(url, {
    waitUntil: options.waitUntil || 'networkidle2',
    timeout: options.timeout || 30000
  });
  
  // Additional wait time to capture delayed pixel fires
  if (options.additionalWait) {
    await new Promise(resolve => setTimeout(resolve, options.additionalWait));
  }
  
  // Detect marketing pixels and tags
  const pixelAnalysis = await detectMarketingPixels(page);
  
  // Analyze SEO metadata
  const seoMetadata = await analyzeSeoMetadata(page);
  
  // Analyze URL structure
  const urlAnalysis = analyzeUrl(url);
  
  // Filter and analyze marketing-related network requests
  const marketingRequests = filterMarketingRequests(requests);
  const networkAnalysis = analyzeNetworkRequests(requests);
  
  // Compile comprehensive analysis
  return {
    url,
    scanTime: new Date().toISOString(),
    pageTitle: seoMetadata.title,
    marketingTech: {
      technologies: pixelAnalysis.technologies,
      pixelIds: pixelAnalysis.pixelIds,
      dataLayerSample: pixelAnalysis.dataLayerSample,
      networkActivity: {
        totalRequests: requests.length,
        marketingRequests: marketingRequests.length,
        trackersByVendor: networkAnalysis.beaconsByVendor
      }
    },
    seo: {
      metadata: seoMetadata,
      url: urlAnalysis
    },
    rawData: {
      allRequests: options.includeAllRequests ? requests : undefined,
      marketingRequests: marketingRequests
    }
  };
}

export {
  analyzeMarketingTech,
  analyzeSeoMetadata,
  analyzeUrl
};