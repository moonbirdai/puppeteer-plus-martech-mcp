/**
 * Provider Registration Module
 * Import and register all available providers
 */
import registry from './ProviderRegistry.js';

// Import providers
import GoogleAnalytics4Provider from './platforms/GoogleAnalytics4.js';
import GoogleAnalyticsProvider from './platforms/GoogleAnalytics.js';
import AdobeAnalyticsProvider from './platforms/AdobeAnalytics.js';
import FacebookPixelProvider from './platforms/FacebookPixel.js';
import GoogleTagManagerProvider from './platforms/GoogleTagManager.js';
import AdobeLaunchProvider from './platforms/AdobeLaunch.js';
import TikTokProvider from './platforms/TikTok.js';
import PinterestProvider from './platforms/Pinterest.js';
import LinkedInProvider from './platforms/LinkedIn.js';
import TwitterProvider from './platforms/Twitter.js';
import MicrosoftClarityProvider from './platforms/MicrosoftClarity.js';

// Initialize and register all providers
function initializeProviders() {
    // Add all providers to the registry
    registry.addProvider(new GoogleAnalytics4Provider());
    registry.addProvider(new GoogleAnalyticsProvider());
    registry.addProvider(new AdobeAnalyticsProvider());
    registry.addProvider(new FacebookPixelProvider());
    registry.addProvider(new GoogleTagManagerProvider());
    registry.addProvider(new AdobeLaunchProvider());
    registry.addProvider(new TikTokProvider());
    registry.addProvider(new PinterestProvider());
    registry.addProvider(new LinkedInProvider());
    registry.addProvider(new TwitterProvider());
    registry.addProvider(new MicrosoftClarityProvider());
    
    // Return the registry for use in tools
    return registry;
}

// Register all providers and export the registry
const providerRegistry = initializeProviders();
export default providerRegistry;
