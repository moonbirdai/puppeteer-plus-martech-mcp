/**
 * Facebook Pixel
 * https://developers.facebook.com/docs/facebook-pixel/
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class FacebookPixelProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "FACEBOOKPIXEL";
        this._pattern = /\/\/www\.facebook\.com\/tr\/?(?:\?|$)/;
        this._name = "Facebook Pixel";
        this._type = "marketing";
        this._keywords = ["facebook", "fb", "meta"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "id",
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
                "key": "customdata",
                "name": "Custom Data"
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
            "id": {
                "name": "Pixel ID",
                "group": "general"
            },
            "tid": {
                "name": "Metadata Tag ID",
                "group": "general"
            },
            "ev": {
                "name": "Event Name",
                "group": "general"
            },
            "dl": {
                "name": "Page URL",
                "group": "general"
            },
            "rl": {
                "name": "Referring URL",
                "group": "general"
            },
            "if": {
                "name": "Within iframe",
                "group": "general"
            },
            "ts": {
                "name": "Timestamp",
                "group": "general"
            },
            "sw": {
                "name": "Screen Width",
                "group": "general"
            },
            "sh": {
                "name": "Screen Height",
                "group": "general"
            },
            "v": {
                "name": "SDK Version",
                "group": "general"
            },
            "r": {
                "name": "Random Number",
                "group": "general"
            },
            "fbp": {
                "name": "Facebook Browser Pixel",
                "group": "general"
            },
            "ud": {
                "name": "User Data",
                "group": "general"
            },
            "cdo": {
                "name": "Custom Data",
                "group": "general"
            },
            "it": {
                "name": "Init Timestamp",
                "group": "general"
            },
            "a": {
                "name": "Deduplication ID",
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
        // Pass along any cd[*] parameters for custom data
        if (/^cd\[(.+)]$/.test(name)) {
            return {
                "key": name,
                "field": "Custom Data: " + RegExp.$1,
                "value": value,
                "group": "customdata"
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
            requestType = params.get("ev") || "PageView";

        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        // Try to extract custom data from JSON and add as individual fields
        if (params.has("cd")) {
            try {
                const customData = JSON.parse(decodeURIComponent(params.get("cd")));
                for (const [key, value] of Object.entries(customData)) {
                    results.push({
                        "key": `cd[${key}]`,
                        "field": `Custom Data: ${key}`,
                        "value": typeof value === "object" ? JSON.stringify(value) : value,
                        "group": "customdata"
                    });
                }
            } catch (e) {
                // Cannot parse custom data
                results.push({
                    "key": "cd",
                    "field": "Custom Data (unparseable)",
                    "value": params.get("cd"),
                    "group": "customdata"
                });
            }
        }

        // Try to extract user data from JSON and add as individual fields
        if (params.has("ud")) {
            try {
                const userData = JSON.parse(decodeURIComponent(params.get("ud")));
                for (const [key, value] of Object.entries(userData)) {
                    // Mask PII fields for privacy (email, phone, etc.)
                    let displayValue = value;
                    if (["em", "ph", "fn", "ln", "ge", "db", "ct", "st", "zp"].includes(key)) {
                        displayValue = "********";
                    }
                    
                    results.push({
                        "key": `ud[${key}]`,
                        "field": `User Data: ${key}`,
                        "value": displayValue,
                        "group": "general"
                    });
                }
            } catch (e) {
                // Cannot parse user data
                results.push({
                    "key": "ud",
                    "field": "User Data (unparseable)",
                    "value": "[MASKED]", // Mask user data for privacy
                    "group": "general"
                });
            }
        }

        return results;
    }
}