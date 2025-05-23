/**
 * SEO analysis tools
 */
import { z } from "zod";
import { analyzeSeoMetadata, analyzeUrl, analyzeImageAltText } from '../seo/metadataAnalyzer.js';

export function registerSeoTools(server, initBrowser) {
  // 1. Comprehensive SEO analysis
  server.tool(
    "audit-seo",
    "Analyze SEO metadata and structure on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze")
    },
    async ({ url }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Analyze SEO metadata
        const seoMetadata = await analyzeSeoMetadata(page);
        
        // Analyze URL structure
        const urlAnalysis = analyzeUrl(url);
        
        // Close the page
        await page.close();
        
        // Compile the SEO analysis
        const seoAnalysis = {
          url,
          urlStructure: urlAnalysis,
          pageMetadata: seoMetadata
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(seoAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing SEO: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 2. SEO metadata analysis
  server.tool(
    "check-page-metadata",
    "Analyze meta tags, titles, and descriptions on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze")
    },
    async ({ url }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Analyze SEO metadata
        const seoMetadata = await analyzeSeoMetadata(page);
        
        // Close the page
        await page.close();
        
        // Create a focused metadata analysis
        const metadataAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          title: seoMetadata.title,
          description: seoMetadata.description,
          keywords: seoMetadata.keywords,
          robots: seoMetadata.robots,
          canonical: seoMetadata.canonical,
          metaTags: seoMetadata.metaTags,
          openGraph: seoMetadata.openGraph,
          twitter: seoMetadata.twitter
        };
        
        // Add some basic SEO evaluations
        const evaluations = [];
        
        if (!metadataAnalysis.title) {
          evaluations.push({ issue: 'Missing page title', severity: 'high' });
        } else if (metadataAnalysis.title.length < 10) {
          evaluations.push({ issue: 'Title is too short', severity: 'medium' });
        } else if (metadataAnalysis.title.length > 60) {
          evaluations.push({ issue: 'Title may be too long for search snippets', severity: 'low' });
        }
        
        if (!metadataAnalysis.description) {
          evaluations.push({ issue: 'Missing meta description', severity: 'medium' });
        } else if (metadataAnalysis.description.length < 50) {
          evaluations.push({ issue: 'Meta description is too short', severity: 'low' });
        } else if (metadataAnalysis.description.length > 160) {
          evaluations.push({ issue: 'Meta description may be too long for search snippets', severity: 'low' });
        }
        
        if (!metadataAnalysis.canonical) {
          evaluations.push({ issue: 'Missing canonical tag', severity: 'medium' });
        }
        
        metadataAnalysis.evaluations = evaluations;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(metadataAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing SEO metadata: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 3. SEO structure analysis
  server.tool(
    "evaluate-page-structure",
    "Analyze URL structure, headings hierarchy, and page organization",
    {
      url: z.string().url().describe("The URL of the webpage to analyze")
    },
    async ({ url }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Analyze SEO metadata (for headings)
        const seoMetadata = await analyzeSeoMetadata(page);
        
        // Analyze URL structure
        const urlAnalysis = analyzeUrl(url);
        
        // Analyze heading structure and content outline
        const contentStructure = await page.evaluate(() => {
          // Function to clean text from extra whitespace
          const cleanText = (text) => text.replace(/\s+/g, ' ').trim();
          
          // Get all headings
          const h1s = Array.from(document.querySelectorAll('h1')).map(h => cleanText(h.textContent));
          const h2s = Array.from(document.querySelectorAll('h2')).map(h => cleanText(h.textContent));
          const h3s = Array.from(document.querySelectorAll('h3')).map(h => cleanText(h.textContent));
          const h4s = Array.from(document.querySelectorAll('h4')).map(h => cleanText(h.textContent));
          const h5s = Array.from(document.querySelectorAll('h5')).map(h => cleanText(h.textContent));
          const h6s = Array.from(document.querySelectorAll('h6')).map(h => cleanText(h.textContent));
          
          // Analyze content sections
          const pageElements = document.querySelectorAll('p, ul, ol, table, figure');
          const contentStats = {
            paragraphs: document.querySelectorAll('p').length,
            lists: document.querySelectorAll('ul, ol').length,
            tables: document.querySelectorAll('table').length,
            images: document.querySelectorAll('img').length,
            videos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
            totalContentElements: pageElements.length
          };
          
          // Analyze internal links
          const internalLinks = Array.from(document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]'))
            .map(a => ({
              text: cleanText(a.textContent),
              href: a.href
            }))
            .slice(0, 20); // Limit to first 20 links
            
          // Check for breadcrumbs
          const breadcrumb = document.querySelector('[class*="breadcrumb"], [id*="breadcrumb"], [class*="crumbs"], nav[aria-label*="Breadcrumb"]');
          const hasBreadcrumbs = !!breadcrumb;
          
          return {
            headings: { h1s, h2s, h3s, h4s, h5s, h6s },
            contentStats,
            internalLinks,
            hasBreadcrumbs
          };
        });
        
        // Close the page
        await page.close();
        
        // Create structure analysis with evaluations
        const structureAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          urlStructure: urlAnalysis,
          contentStructure,
        };
        
        // Add evaluations
        const evaluations = [];
        
        // URL evaluations
        if (urlAnalysis.issues && urlAnalysis.issues.length > 0) {
          urlAnalysis.issues.forEach(issue => {
            evaluations.push({ issue: `URL Issue: ${issue}`, severity: 'medium' });
          });
        }
        
        // Heading evaluations
        if (contentStructure.headings.h1s.length === 0) {
          evaluations.push({ issue: 'Missing H1 heading', severity: 'high' });
        } else if (contentStructure.headings.h1s.length > 1) {
          evaluations.push({ issue: 'Multiple H1 headings (should typically have only one)', severity: 'medium' });
        }
        
        if (contentStructure.headings.h2s.length === 0 && contentStructure.contentStats.paragraphs > 3) {
          evaluations.push({ issue: 'No H2 headings for content organization', severity: 'medium' });
        }
        
        // Content evaluations
        if (contentStructure.contentStats.paragraphs < 3) {
          evaluations.push({ issue: 'Limited textual content (thin content)', severity: 'medium' });
        }
        
        if (!contentStructure.hasBreadcrumbs) {
          evaluations.push({ issue: 'No breadcrumb navigation detected', severity: 'low' });
        }
        
        structureAnalysis.evaluations = evaluations;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(structureAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing SEO structure: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 4. Structured data analysis
  server.tool(
    "extract-schema-markup",
    "Analyze JSON-LD, microdata, and schema.org markup on a webpage",
    {
      url: z.string().url().describe("The URL of the webpage to analyze")
    },
    async ({ url }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000 // 60 second timeout
        });
        
        // Analyze SEO metadata (to extract structured data)
        const seoMetadata = await analyzeSeoMetadata(page);
        
        // Get additional microdata that might not be in JSON-LD
        const microdata = await page.evaluate(() => {
          // Check for microdata attributes
          const microdataElements = document.querySelectorAll('[itemscope]');
          
          // If no microdata, return empty array
          if (microdataElements.length === 0) return [];
          
          // Extract simplified microdata structure
          return Array.from(microdataElements).map(element => {
            const itemtype = element.getAttribute('itemtype') || 'Unknown';
            const properties = Array.from(element.querySelectorAll('[itemprop]')).map(prop => {
              return {
                property: prop.getAttribute('itemprop'),
                content: prop.textContent.trim().substring(0, 100)
              };
            });
            
            return {
              type: itemtype,
              properties: properties
            };
          });
        });
        
        // Close the page
        await page.close();
        
        // Compile the structured data analysis
        const structuredDataAnalysis = {
          url,
          scanTime: new Date().toISOString(),
          jsonLd: seoMetadata.structured || [],
          microdata: microdata || [],
          hasStructuredData: (seoMetadata.structured && seoMetadata.structured.length > 0) || microdata.length > 0
        };
        
        // Identify schema types
        const schemaTypes = new Set();
        
        if (structuredDataAnalysis.jsonLd) {
          structuredDataAnalysis.jsonLd.forEach(item => {
            if (item['@type']) {
              if (Array.isArray(item['@type'])) {
                item['@type'].forEach(type => schemaTypes.add(type));
              } else {
                schemaTypes.add(item['@type']);
              }
            }
          });
        }
        
        if (structuredDataAnalysis.microdata) {
          structuredDataAnalysis.microdata.forEach(item => {
            if (item.type && item.type.includes('schema.org')) {
              const type = item.type.split('/').pop();
              if (type) schemaTypes.add(type);
            }
          });
        }
        
        structuredDataAnalysis.schemaTypes = Array.from(schemaTypes);
        
        // Add evaluations
        const evaluations = [];
        
        if (!structuredDataAnalysis.hasStructuredData) {
          evaluations.push({ issue: 'No structured data found', severity: 'medium' });
        }
        
        if (structuredDataAnalysis.jsonLd.length === 0) {
          evaluations.push({ issue: 'No JSON-LD structured data', severity: 'medium' });
        }
        
        structuredDataAnalysis.evaluations = evaluations;
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(structuredDataAnalysis, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing structured data: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // 5. Image Alt Text Analysis
  server.tool(
    "audit-image-alt-text",
    "Audit image alt text on a webpage for accessibility and SEO compliance",
    {
      url: z.string().url().describe("The URL of the webpage to analyze")
    },
    async ({ url }) => {
      try {
        // Initialize browser with optimization options
        const browser = await initBrowser({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to the URL with extended timeout
        await page.goto(url, { 
          waitUntil: 'networkidle2', // Wait until network is idle for better image loading
          timeout: 60000 // 60 second timeout
        });
        
        // Give extra time for lazy-loaded images to appear
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          return new Promise(resolve => {
            setTimeout(resolve, 2000); // 2 second delay for lazy loading
          });
        });
        
        // Scroll back to top
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        
        // Analyze image alt text
        const altTextAnalysis = await analyzeImageAltText(page);
        
        // Take a screenshot for reference
        const screenshotBuffer = await page.screenshot({ 
          fullPage: false, 
          type: 'jpeg',
          quality: 60
        });
        const screenshotBase64 = screenshotBuffer.toString('base64');
        
        // Close the page
        await page.close();
        
        // Create a summary of findings
        const { totalImages, imagesWithAlt, imagesWithIssues, decorativeImages, missingAltImages, complianceRate } = altTextAnalysis;
        
        // Sort images by severity of issues
        altTextAnalysis.images.sort((a, b) => b.issues.length - a.issues.length);
        
        // Create accessibility score (0-100)
        const accessibilityScore = Math.round(complianceRate);
        
        // Create a human-readable report
        const report = {
          url,
          scanTime: new Date().toISOString(),
          summary: {
            totalImages,
            imagesWithAlt,
            imagesWithIssues,
            decorativeImages,
            missingAltImages,
            complianceRate: Math.round(complianceRate * 100) / 100, // Round to 2 decimal places
            accessibilityScore
          },
          recommendation: getRecommendation(accessibilityScore),
          imageDetails: altTextAnalysis.images.map(img => ({
            src: img.src,
            alt: img.alt,
            hasAlt: img.hasAlt,
            isDecorative: img.isDecorative,
            isInLink: img.isInLink,
            linkUrl: img.linkUrl,
            figcaptionText: img.figcaptionText,
            issues: img.issues
          }))
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(report, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error analyzing image alt text: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}

// Helper function to generate recommendations based on score
function getRecommendation(score) {
  if (score >= 90) {
    return "Excellent! Your page has high-quality alt text that supports accessibility and SEO.";
  } else if (score >= 70) {
    return "Good job! Your page has decent alt text coverage, but there's room for improvement.";
  } else if (score >= 50) {
    return "Fair. Your page needs considerable work on image alt text to improve accessibility and SEO.";
  } else {
    return "Poor. Your page requires immediate attention to image alt text for basic accessibility compliance.";
  }
}