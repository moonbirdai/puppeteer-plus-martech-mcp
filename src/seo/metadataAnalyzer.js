/**
 * Module for analyzing SEO metadata on webpages
 */

/**
 * Analyzes the page for SEO metadata
 * @param {Page} page - Puppeteer page object
 * @returns {Object} Results of the SEO metadata analysis
 */
async function analyzeSeoMetadata(page) {
  return await page.evaluate(() => {
    const metadata = {
      title: document.title || '',
      metaTags: [],
      headings: {
        h1: [],
        h2: [],
        h3: []
      },
      canonical: null,
      structured: [],
      openGraph: {},
      twitter: {},
      robots: null
    };
    
    // Get all meta tags
    const metaTags = document.querySelectorAll('meta');
    for (const meta of metaTags) {
      const name = meta.getAttribute('name');
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      const httpEquiv = meta.getAttribute('http-equiv');
      
      const metaInfo = {
        name: name || property || httpEquiv,
        content: content || '',
        type: name ? 'name' : (property ? 'property' : 'http-equiv')
      };
      
      metadata.metaTags.push(metaInfo);
      
      // Extract specific important meta tags
      if (name === 'description') {
        metadata.description = content;
      } else if (name === 'keywords') {
        metadata.keywords = content;
      } else if (name === 'robots') {
        metadata.robots = content;
      } else if (property && property.startsWith('og:')) {
        // Open Graph tags
        const ogProperty = property.substring(3);
        metadata.openGraph[ogProperty] = content;
      } else if (property && property.startsWith('twitter:')) {
        // Twitter Card tags
        const twitterProperty = property.substring(8);
        metadata.twitter[twitterProperty] = content;
      }
    }
    
    // Get canonical link
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      metadata.canonical = canonical.getAttribute('href');
    }
    
    // Get headings
    const h1s = document.querySelectorAll('h1');
    for (const h1 of h1s) {
      metadata.headings.h1.push(h1.textContent.trim());
    }
    
    const h2s = document.querySelectorAll('h2');
    for (const h2 of h2s) {
      metadata.headings.h2.push(h2.textContent.trim());
    }
    
    const h3s = document.querySelectorAll('h3');
    for (const h3 of h3s) {
      metadata.headings.h3.push(h3.textContent.trim());
    }
    
    // Get structured data (JSON-LD)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        metadata.structured.push(data);
      } catch (e) {
        // Invalid JSON-LD
        metadata.structured.push({
          error: 'Invalid JSON-LD',
          raw: script.textContent.substring(0, 100) + '...'
        });
      }
    }
    
    return metadata;
  });
}

/**
 * Analyzes the URL structure for SEO best practices
 * @param {string} url - URL of the page
 * @returns {Object} URL analysis results
 */
function analyzeUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Check for common SEO issues in URLs
    const issues = [];
    
    if (parsedUrl.pathname.includes('__')) {
      issues.push('URL contains double underscores');
    }
    
    if (parsedUrl.pathname.includes('%20')) {
      issues.push('URL contains spaces (encoded as %20)');
    }
    
    if (parsedUrl.pathname.match(/[A-Z]/)) {
      issues.push('URL contains uppercase letters');
    }
    
    if (parsedUrl.pathname.split('/').length > 5) {
      issues.push('URL has deep nesting (more than 4 levels)');
    }
    
    if (parsedUrl.searchParams.toString().length > 100) {
      issues.push('URL has lengthy query parameters');
    }
    
    if (parsedUrl.pathname.match(/\d{4,}/)) {
      issues.push('URL contains long number sequences');
    }
    
    if (!parsedUrl.pathname.includes('.') && !parsedUrl.pathname.endsWith('/')) {
      issues.push('URL doesn\'t end with a trailing slash or file extension');
    }
    
    return {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      queryParams: Object.fromEntries(parsedUrl.searchParams.entries()),
      hash: parsedUrl.hash,
      issues: issues,
      isSeoFriendly: issues.length === 0
    };
  } catch (e) {
    return {
      error: 'Invalid URL',
      message: e.message
    };
  }
}

/**
 * Analyzes images on the page for alt text and accessibility
 * @param {Page} page - Puppeteer page object
 * @returns {Object} Results of the image alt text analysis
 */
async function analyzeImageAltText(page) {
  return await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const imageData = [];
    
    for (const img of images) {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt');
      const width = img.getAttribute('width') || img.naturalWidth || 0;
      const height = img.getAttribute('height') || img.naturalHeight || 0;
      const isDecorative = alt === '';
      const hasValidAlt = alt !== null && alt !== undefined;
      
      // Try to get contextual information
      let parentElement = img.parentElement;
      let parentTag = parentElement ? parentElement.tagName.toLowerCase() : '';
      let closestFigure = img.closest('figure');
      let figcaption = closestFigure ? closestFigure.querySelector('figcaption') : null;
      let figcaptionText = figcaption ? figcaption.textContent.trim() : '';
      
      // Check if image is in a link
      const isInLink = parentTag === 'a';
      const linkUrl = isInLink ? parentElement.getAttribute('href') : null;
      
      // Try to derive filename if possible
      let filename = '';
      try {
        if (src) {
          const urlObj = new URL(src, window.location.href);
          const pathParts = urlObj.pathname.split('/');
          filename = pathParts[pathParts.length - 1];
        }
      } catch (e) {
        // If URL parsing fails, try a basic extraction
        const srcParts = src.split('/');
        filename = srcParts[srcParts.length - 1];
      }
      
      imageData.push({
        src: src,
        alt: alt,
        hasAlt: hasValidAlt,
        isDecorative: isDecorative,
        isEmpty: alt === '',
        dimensions: { width, height },
        filename: filename,
        isInLink: isInLink,
        linkUrl: linkUrl,
        figcaptionText: figcaptionText,
        parentTag: parentTag,
        issues: getIssues(alt, isDecorative, width, height, filename, isInLink)
      });
    }
    
    // Helper function to determine issues with alt text
    function getIssues(alt, isDecorative, width, height, filename, isInLink) {
      const issues = [];
      
      if (alt === null || alt === undefined) {
        issues.push('Missing alt attribute');
      } else if (alt === '' && !isDecorative) {
        issues.push('Empty alt text on non-decorative image');
      } else if (alt.length > 125) {
        issues.push('Alt text exceeds recommended length (125 characters)');
      } else if (alt.toLowerCase().includes('image of') || alt.toLowerCase().includes('picture of')) {
        issues.push('Alt text contains redundant phrases like "image of" or "picture of"');
      } else if (alt === filename) {
        issues.push('Alt text is same as filename');
      } else if (isInLink && alt === '') {
        issues.push('Image in a link has empty alt text (should describe link destination)');
      }
      
      if (width < 1 || height < 1) {
        issues.push('Image has zero or unspecified dimensions');
      }
      
      return issues;
    }
    
    // Create a summary
    const totalImages = imageData.length;
    const imagesWithAlt = imageData.filter(img => img.hasAlt).length;
    const imagesWithIssues = imageData.filter(img => img.issues.length > 0).length;
    const decorativeImages = imageData.filter(img => img.isDecorative).length;
    const missingAltImages = imageData.filter(img => img.alt === null || img.alt === undefined).length;
    
    return {
      totalImages,
      imagesWithAlt,
      imagesWithIssues,
      decorativeImages,
      missingAltImages,
      complianceRate: totalImages > 0 ? ((imagesWithAlt - imagesWithIssues) / totalImages) * 100 : 100,
      images: imageData
    };
  });
}

export {
  analyzeSeoMetadata,
  analyzeUrl,
  analyzeImageAltText
};