[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/moonbirdai-puppeteer-plus-martech-mcp-badge.png)](https://mseep.ai/app/moonbirdai-puppeteer-plus-martech-mcp)

# Puppeteer+ MarTech

A Model Context Protocol (MCP) server that extends Puppeteer functionality with specialized capabilities for digital marketing and SEO analysis. This server enables LLM applications like Claude to perform comprehensive marketing technology audits on websites.

## Installation & Usage

### Quick Installation

```bash
npm install puppeteer-plus-martech
```

### Claude Desktop Integration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puppeteer-plus-martech": {
      "command": "npx",
      "args": [
        "-y",
        "puppeteer-plus-martech"
      ]
    }
  }
}
```

### Running as an MCP Server

```bash
npx puppeteer-plus-martech
```

## Acknowledgment

**This project is an experimental implementation inspired by and building upon [@modelcontextprotocol/server-puppeteer](https://www.pulsemcp.com/servers/modelcontextprotocol-puppeteer) by Anthropic.** While it shares the same foundational architecture and core capabilities, this project extends the original with specialized tools focused on digital marketing analytics and technology detection. See [ACKNOWLEDGMENTS.md](./ACKNOWLEDGMENTS.md) for more details.

## Features

- **Marketing Technology Detection**: Identify analytics tools, marketing pixels, tag managers, and advertising technologies
- **Network Beacon Analysis**: Capture and analyze marketing-related network requests
- **Advanced Analytics Parsing**: Parse both traditional Adobe Analytics and Experience Platform Web SDK (Alloy) beacons with XDM schemas
- **SEO Metadata Analysis**: Evaluate page metadata, structured data, and SEO best practices
- **Visual Debugging**: Generate screenshots with marketing technologies highlighted
- **Granular Analysis Tools**: Specialized tools for specific aspects of digital marketing and SEO
- **Omnibug Integration**: Enhanced detection capabilities based on the popular Omnibug browser extension

## Supported Technologies

### Analytics & Tag Management
- Google Analytics (Universal Analytics & GA4)
- Google Tag Manager
- Adobe Analytics
- Adobe Launch/DTM
- Adobe Experience Platform Web SDK (Alloy)
- Adobe Experience Edge
- Adobe Experience Cloud ID Service
- Adobe Target
- Adobe Audience Manager
- Segment
- Hotjar
- Mixpanel
- Amplitude
- Microsoft Clarity
- Tealium IQ
- Matomo/Piwik
- Ensighten
- AT Internet

### Advertising Pixels
- Facebook Pixel
- Google Ads
- TikTok Pixel
- Pinterest Tag
- LinkedIn Insight Tag
- Twitter/X Pixel
- Microsoft Advertising
- Snapchat Pixel
- Criteo
- RTB House
- Reddit Pixel
- Spotify Pixel
- Outbrain

### Marketing Automation
- HubSpot
- Marketo
- Salesforce Marketing Cloud
- Braze
- Brevo

## Tools

### Core Navigation & Screenshot Tools

#### puppeteer_navigate
Navigates to a specified URL in the browser.

**Parameters:**
- `url` (string, required): URL to navigate to
- `launchOptions` (object, optional): PuppeteerJS LaunchOptions to customize browser behavior
- `allowDangerous` (boolean, optional): Allow dangerous LaunchOptions that reduce security

**Returns:**
Confirmation message that the navigation was successful.

#### puppeteer_screenshot
Takes a screenshot of the current page or a specific element.

**Parameters:**
- `name` (string, required): Name for the screenshot
- `selector` (string, optional): CSS selector for element to screenshot
- `width` (number, optional): Width in pixels (default: 800)
- `height` (number, optional): Height in pixels (default: 600)

**Returns:**
The captured screenshot and a success message.

### Enhanced Marketing Technology Analysis Tools

#### scan-marketing-stack
Comprehensive detection and analysis of all marketing technologies on a webpage using the enhanced Omnibug-based provider system.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait for delayed pixels to fire (in milliseconds)

**Returns:**
Complete analysis of all detected marketing technologies, including:
- Categorized list of all detected technologies (analytics, advertising, tag managers, etc.)
- Detection method for each technology (global variable, network request)
- Technology-specific properties (account IDs, container IDs, etc.)
- Data layer information when available
- Network request statistics

#### visualize-marketing-tech
Takes a screenshot with detailed marketing technologies visually highlighted, with improved detection capabilities.

**Parameters:**
- `url` (string, required): The URL of the webpage to screenshot
- `highlightMode` (string, optional): How to highlight detected marketing technologies ("basic", "detailed", or "none")

**Returns:**
A screenshot with marketing technologies visually highlighted and labeled. The "detailed" mode provides more information about each technology directly on the screenshot.

### Original Marketing Technology Analysis Tools

#### find-marketing-technologies
Provides a high-level overview of all marketing technologies on a webpage.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait for delayed pixels to fire (in milliseconds)

**Returns:**
Summary of all detected marketing technologies, including:
- List of technologies with vendor and category information
- Total number of tracking requests
- Number of marketing-related requests

#### analyze-analytics-platforms
Deep dive into analytics platforms like GA4, Universal Analytics, Adobe Analytics, etc.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait (in milliseconds)

**Returns:**
Detailed analysis of analytics tools, including:
- Analytics-specific technologies detected
- Analytics-related tracking IDs (GA4, UA, etc.)
- Data layer sample if available
- Analytics-related network requests

#### detect-ad-pixels
Focuses on advertising platforms like Facebook, TikTok, etc.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait (in milliseconds)

**Returns:**
Detailed analysis of advertising pixels, including:
- Advertising-specific technologies detected
- Pixel IDs (Facebook, TikTok, etc.)
- Advertising-related network requests

#### identify-tag-managers
Analyzes tag management systems like GTM, Tealium, etc.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait (in milliseconds)

**Returns:**
Detailed analysis of tag managers, including:
- Tag manager technologies detected
- Tag manager IDs (GTM container ID, etc.)
- Data layer sample and events
- Configuration insights (when available)

#### track-marketing-beacons
Detailed analysis of network requests for tracking and marketing activities.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait (in milliseconds)
- `maxRequests` (number, optional): Maximum number of requests to include in results

**Returns:**
Comprehensive network request analysis, including:
- Total requests and marketing-related requests
- Breakdown of trackers by vendor (Google, Facebook, etc.)
- Detailed tracking requests for each vendor category
- Request timing and patterns

#### parse-analytics-beacons
Capture and parse both traditional Adobe Analytics and Adobe Experience Platform Web SDK beacons.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Time to wait for beacons to fire (milliseconds)
- `simulateClick` (string, optional): Optional CSS selector to click for interaction beacons

**Returns:**
Detailed parsing of analytics beacons, including:
- Complete breakdown of Adobe Analytics variables (props, eVars, events, etc.)
- Parsed XDM schema data for Adobe Experience Platform Web SDK
- Both page load and interaction beacons (if simulateClick is provided)
- Categorized data by beacon type and provider

#### highlight-marketing-tools
Takes a screenshot with marketing technologies visually highlighted.

**Parameters:**
- `url` (string, required): The URL of the webpage to screenshot
- `highlightPixels` (boolean, optional): Whether to highlight detected marketing pixels

**Returns:**
A screenshot with marketing technologies visually highlighted. Different types of technologies (GTM, GA, Facebook, etc.) are highlighted with different colors for easy identification.

### SEO Analysis Tools

#### audit-seo
Complete SEO analysis combining metadata, structure, and URL insights.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Comprehensive SEO analysis, including:
- URL structure with SEO best practices evaluation
- Page metadata
- Heading structure
- Canonical links
- OpenGraph and Twitter card data

#### check-page-metadata
Focused analysis of meta tags, titles, and descriptions.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Detailed metadata analysis, including:
- Page title and meta description
- Keywords and robots directives
- OpenGraph and Twitter card data
- Meta tag evaluations with SEO recommendations
- Content length and optimization suggestions

#### evaluate-page-structure
Analysis of URL structure, headings hierarchy, and page organization.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Structural SEO analysis, including:
- URL analysis with SEO recommendations
- Complete heading hierarchy (H1-H6)
- Content structure statistics
- Internal linking analysis
- Navigation elements (breadcrumbs, etc.)
- Structure evaluations with SEO recommendations

#### extract-schema-markup
Analysis of JSON-LD, microdata, and schema.org markup.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Structured data analysis, including:
- JSON-LD structured data
- Microdata implementations
- Schema.org types detected
- Structured data evaluations with recommendations

#### audit-image-alt-text
Audit image alt text on a webpage for accessibility and SEO compliance.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Comprehensive image alt text analysis, including:
- Summary of image alt text compliance
- Total number of images detected
- Images with/without alt text
- Accessibility score (0-100)
- Detailed analysis of each image's alt text
- Specific issues for each image (missing alt, empty alt, etc.)
- Recommendations for improving accessibility and SEO


```

## Technology Details

### Omnibug Integration

This server incorporates enhanced detection capabilities inspired by the [Omnibug](https://github.com/MisterPhilip/omnibug) browser extension. The integration includes:

- Comprehensive provider framework for detecting specific marketing technologies
- URL pattern matching for identifying analytics and marketing beacons
- Parameter parsing for extracting meaningful information from beacon requests
- Support for a wide variety of marketing technologies and vendors

## Development

Clone the repository:

```bash
git clone https://github.com/MBadkins/puppeteer-plus-martech.git
cd puppeteer-plus-martech
npm install
```

Run locally:

```bash
node index.js
```

Run in development mode with auto-restart:

```bash
npm run dev
```

Test the server:

```bash
npm test
```

## License

MIT