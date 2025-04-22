/**
 * TikTok Pixel
 * https://ads.tiktok.com/marketing_api/docs?id=1701890979375106
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class TikTokProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "TIKTOK";
        this._pattern = /\/\/analytics\.tiktok\.com\/(?:i18n\/)?pixel\/(?:track|events)/;
        this._name = "TikTok Pixel";
        this._type = "marketing";
        this._keywords = ["tiktok", "bytedance"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "sdkid",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "properties",
                "name": "Event Properties"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "ttclid": {
                "name": "TikTok Click ID",
                "group": "general"
            },
            "sdkid": {
                "name": "Pixel ID",
                "group": "general"
            },
            "event": {
                "name": "Event Type",
                "group": "general"
            },
            "data": {
                "name": "Event Data",
                "group": "general"
            },
            "device_id": {
                "name": "Device ID",
                "group": "general"
            },
            "cookie_id": {
                "name": "Cookie ID",
                "group": "general"
            },
            "pixel_code": {
                "name": "Pixel Code",
                "group": "general"
            },
            "page_title": {
                "name": "Page Title",
                "group": "general"
            },
            "page_url": {
                "name": "Page URL",
                "group": "general"
            },
            "page_referrer": {
                "name": "Page Referrer",
                "group": "general"
            },
            "browser_language": {
                "name": "Browser Language",
                "group": "general"
            },
            "browser_platform": {
                "name": "Browser Platform",
                "group": "general"
            },
            "browser_name": {
                "name": "Browser Name",
                "group": "general"
            },
            "browser_version": {
                "name": "Browser Version",
                "group": "general"
            },
            "browser_online": {
                "name": "Browser Online",
                "group": "general"
            },
            "screen_width": {
                "name": "Screen Width",
                "group": "general"
            },
            "screen_height": {
                "name": "Screen Height",
                "group": "general"
            },
            "requestType": {
                "hidden": true
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value) {
        // Handle properties nested in the data parameter
        if (name === "data") {
            try {
                const data = JSON.parse(decodeURIComponent(value));
                
                return {
                    "key": name,
                    "field": "Event Data (JSON)",
                    "value": JSON.stringify(data, null, 2),
                    "group": "properties"
                };
            } catch (e) {
                // If it's not valid JSON, treat as a regular parameter
                return super.handleQueryParam(name, value);
            }
        }
        
        // Extract properties from the data string
        if (name.startsWith("properties.")) {
            const propertyName = name.split(".")[1];
            return {
                "key": name,
                "field": `Property: ${propertyName}`,
                "value": value,
                "group": "properties"
            };
        }
        
        return super.handleQueryParam(name, value);
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {URL}     url
     * @param    {URLSearchParams}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            requestType = params.get("event") || "PageView";

        // Try to extract pixel ID from URL path for older format
        const pixelIdMatch = url.pathname.match(/\/pixel\/track\/([^/?]+)/);
        if (pixelIdMatch && pixelIdMatch[1]) {
            results.push({
                "key": "sdkid",
                "field": "Pixel ID",
                "value": pixelIdMatch[1],
                "group": "general"
            });
        }

        // If data parameter exists, extract event properties
        if (params.has("data")) {
            try {
                const data = JSON.parse(decodeURIComponent(params.get("data")));
                
                // Extract event type
                if (data.event) {
                    requestType = data.event;
                }
                
                // Extract pixel code/ID
                if (data.pixel_code) {
                    results.push({
                        "key": "pixel_code",
                        "field": "Pixel Code",
                        "value": data.pixel_code,
                        "group": "general"
                    });
                }
                
                // Extract custom properties
                if (data.properties) {
                    for (const [key, value] of Object.entries(data.properties)) {
                        results.push({
                            "key": `properties.${key}`,
                            "field": `Property: ${key}`,
                            "value": typeof value === "object" ? JSON.stringify(value) : value,
                            "group": "properties"
                        });
                    }
                }
            } catch (e) {
                // Error parsing JSON
            }
        }

        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}