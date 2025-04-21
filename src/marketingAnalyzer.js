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
  // Setup request interception to capture network activity with optimization options
  const interceptionOptions = {
    blockResources: options.blockResources || [] // Block specified resource types
  };
  const requests = await setupRequestInterception(page, interceptionOptions);
  
  // Set default timeout options
  const navigationOptions = {
    waitUntil: options.waitUntil || 'domcontentloaded', // Less strict than networkidle2
    timeout: options.timeout || 60000 // 60 second timeout default
  };

  try {
    // Navigate to the URL with extended timeout
    console.error(`Navigating to ${url} with ${navigationOptions.timeout}ms timeout`);
    await page.goto(url, navigationOptions);
    console.error('Page navigation completed successfully');
    
    // Additional wait time to capture delayed pixel fires
    if (options.additionalWait) {
      console.error(`Waiting additional ${options.additionalWait}ms for delayed pixels`);
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
  } catch (error) {
    console.error(`Error analyzing ${url}: ${error.message}`);
    
    // Return partial results if available
    return {
      url,
      scanTime: new Date().toISOString(),
      error: error.message,
      partialData: {
        requestsCount: requests.length,
        marketingRequestsCount: filterMarketingRequests(requests).length
      }
    };
  }
}

export {
  analyzeMarketingTech,
  analyzeSeoMetadata,
  analyzeUrl
};