# Puppeteer Plus MCP Server

A Model Context Protocol (MCP) server that extends Puppeteer functionality with specialized capabilities for digital marketing and SEO analysis. This server enables LLM applications like Claude to perform comprehensive marketing technology audits on websites.

## Features

- **Marketing Technology Detection**: Identify analytics tools, marketing pixels, tag managers, and advertising technologies
- **Network Beacon Analysis**: Capture and analyze marketing-related network requests
- **SEO Metadata Analysis**: Evaluate page metadata, structured data, and SEO best practices
- **Visual Debugging**: Generate screenshots with marketing technologies highlighted
- **Granular Analysis Tools**: Specialized tools for specific aspects of digital marketing and SEO

## Supported Technologies

### Analytics & Tag Management
- Google Analytics (Universal Analytics & GA4)
- Google Tag Manager
- Adobe Analytics
- Adobe Launch/DTM
- Segment
- Hotjar
- Mixpanel
- Amplitude

### Advertising Pixels
- Facebook Pixel
- Google Ads
- TikTok Pixel
- Pinterest Tag
- LinkedIn Insight Tag
- Twitter/X Pixel
- Microsoft Advertising

### Marketing Automation
- HubSpot
- Marketo
- Salesforce Marketing Cloud

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

### Marketing Technology Analysis Tools

#### analyze-general-marketing-tech
Provides a high-level overview of all marketing technologies on a webpage.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait for delayed pixels to fire (in milliseconds)

**Returns:**
Summary of all detected marketing technologies, including:
- List of technologies with vendor and category information
- Total number of tracking requests
- Number of marketing-related requests

#### analyze-analytics-tools
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

#### analyze-advertising-pixels
Focuses on advertising platforms like Facebook, TikTok, etc.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze
- `waitTime` (number, optional): Additional time to wait (in milliseconds)

**Returns:**
Detailed analysis of advertising pixels, including:
- Advertising-specific technologies detected
- Pixel IDs (Facebook, TikTok, etc.)
- Advertising-related network requests

#### analyze-tag-managers
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

#### analyze-network-requests
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

#### create-marketing-tech-screenshot
Takes a screenshot with marketing technologies visually highlighted.

**Parameters:**
- `url` (string, required): The URL of the webpage to screenshot
- `highlightPixels` (boolean, optional): Whether to highlight detected marketing pixels

**Returns:**
A screenshot with marketing technologies visually highlighted. Different types of technologies (GTM, GA, Facebook, etc.) are highlighted with different colors for easy identification.

### SEO Analysis Tools

#### analyze-seo
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

#### analyze-seo-metadata
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

#### analyze-seo-structure
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

#### analyze-structured-data
Analysis of JSON-LD, microdata, and schema.org markup.

**Parameters:**
- `url` (string, required): The URL of the webpage to analyze

**Returns:**
Structured data analysis, including:
- JSON-LD structured data
- Microdata implementations
- Schema.org types detected
- Structured data evaluations with recommendations

## Installation

```bash
npm install @modelcontextprotocol/server-puppeteer-plus
```

## Usage

### As an MCP Server

```bash
npx @modelcontextprotocol/server-puppeteer-plus
```

### In Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "puppeteer-plus": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer-plus"
      ]
    }
  }
}
```

## Development

Clone the repository:

```bash
git clone https://github.com/yourusername/puppeteer-plus.git
cd puppeteer-plus
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

## License

MIT