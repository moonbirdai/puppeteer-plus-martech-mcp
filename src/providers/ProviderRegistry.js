/**
 * Provider Registry for managing analytics providers
 * Adapted from Omnibug's OmnibugProvider
 */

import BaseProvider from './BaseProvider.js';

class ProviderRegistry {
    constructor() {
        this.providers = {};
        this.defaultPatterns = [];
        this.defaultPatternRegex = new RegExp();
    }

    /**
     * Add a new provider to the registry
     * 
     * @param {BaseProvider} provider - The provider instance to add
     */
    addProvider(provider) {
        this.providers[provider.key] = provider;
        this.defaultPatterns.push(provider.pattern);
        this.defaultPatternRegex = new RegExp(this.defaultPatterns.map(pattern => {
            return pattern.source;
        }).join("|"), "i");
    }

    /**
     * Get all registered providers
     * 
     * @returns {Object} - Map of provider keys to provider instances
     */
    getProviders() {
        return this.providers;
    }

    /**
     * Check if a URL matches any provider pattern
     * 
     * @param {string} url - URL to check
     * @returns {boolean} - True if the URL matches any provider pattern
     */
    checkUrl(url) {
        return this.defaultPatternRegex.test(url);
    }

    /**
     * Get the appropriate provider for a URL
     * 
     * @param {string} url - URL to check
     * @returns {BaseProvider} - The matching provider or a default BaseProvider
     */
    getProviderForUrl(url) {
        for (const key in this.providers) {
            if (Object.prototype.hasOwnProperty.call(this.providers, key) && 
                this.providers[key].checkUrl(url)) {
                return this.providers[key];
            }
        }
        return new BaseProvider();
    }

    /**
     * Parse a URL using the appropriate provider
     * 
     * @param {string} url - URL to parse
     * @param {string} postData - POST data, if applicable
     * @returns {Object} - Parsed data from the provider
     */
    parseUrl(url, postData = "") {
        return this.getProviderForUrl(url).parseUrl(url, postData);
    }

    /**
     * Get a combined pattern for all providers
     * 
     * @param {Object} providerInfo - Optional info about which providers to include
     * @returns {RegExp} - Combined pattern for all enabled providers
     */
    getPattern(providerInfo = {}) {
        const patterns = [];
        Object.keys(this.providers).forEach((key) => {
            if (typeof providerInfo[key] === "undefined" || providerInfo[key].enabled) {
                patterns.push(this.providers[key].pattern.source);
            }
        });
        return new RegExp(patterns.join("|"), "i");
    }

    /**
     * Get all providers that match a specific URL
     * 
     * @param {string} url - URL to check
     * @returns {Array} - Array of matching providers
     */
    getMatchingProviders(url) {
        const matches = [];
        for (const key in this.providers) {
            if (Object.prototype.hasOwnProperty.call(this.providers, key) && 
                this.providers[key].checkUrl(url)) {
                matches.push(this.providers[key]);
            }
        }
        return matches;
    }

    /**
     * Parse a URL with all matching providers
     * 
     * @param {string} url - URL to parse
     * @param {string} postData - POST data, if applicable
     * @returns {Array} - Array of parsed data from all matching providers
     */
    parseUrlWithAllProviders(url, postData = "") {
        const results = [];
        const matchingProviders = this.getMatchingProviders(url);
        
        for (const provider of matchingProviders) {
            results.push(provider.parseUrl(url, postData));
        }
        
        return results;
    }
}

// Create and export a singleton instance
const registry = new ProviderRegistry();
export default registry;
