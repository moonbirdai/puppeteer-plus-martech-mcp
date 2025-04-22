/**
 * Microsoft Clarity
 * https://clarity.microsoft.com/
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class MicrosoftClarityProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "MICROSOFTCLARITY";
        this._pattern = /\/\/(?:www\.)?clarity\.ms\/(?:tag|collect|eus-breeziest|eventlogger)/;
        this._name = "Microsoft Clarity";
        this._type = "analytics";
        this._keywords = ["clarity", "microsoft", "session replay", "heatmap"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "projectId",
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
                "key": "session",
                "name": "Session Data"
            },
            {
                "key": "metrics",
                "name": "Metrics"
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
            "projectId": {
                "name": "Project ID",
                "group": "general"
            },
            "k": {
                "name": "Project ID",
                "group": "general"
            },
            "v": {
                "name": "Clarity Version",
                "group": "general"
            },
            "ua": {
                "name": "User Agent",
                "group": "general"
            },
            "url": {
                "name": "Page URL",
                "group": "general"
            },
            "referrer": {
                "name": "Referrer",
                "group": "general"
            },
            "c": {
                "name": "Clarity Cookie",
                "group": "session"
            },
            "s": {
                "name": "Session ID",
                "group": "session"
            },
            "aid": {
                "name": "Application ID",
                "group": "general"
            },
            "e": {
                "name": "Encoded Metrics Data",
                "group": "metrics"
            },
            "sm": {
                "name": "Session Metadata",
                "group": "session"
            },
            "m": {
                "name": "Metrics",
                "group": "metrics"
            },
            "se": {
                "name": "Session Expiry",
                "group": "session"
            },
            "ts": {
                "name": "Timestamp",
                "group": "general"
            },
            "d": {
                "name": "Device Data",
                "group": "general"
            },
            "ct": {
                "name": "Connection Type",
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
        // Special handling for data payloads
        if (name === "e" || name === "d" || name === "m" || name === "sm") {
            // Since these are often encoded and compressed, we just note their presence
            return {
                "key": name,
                "field": this.keys[name] ? this.keys[name].name : name,
                "value": `[${value.length} bytes of encoded data]`,
                "group": this.keys[name] ? this.keys[name].group : "general"
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
            requestType = "Data Collection";

        // Determine the request type based on the URL
        if (url.pathname.includes("/tag/")) {
            requestType = "Script Load";
            
            // Extract project ID from the script tag URL
            const projectIdMatch = url.pathname.match(/\/tag\/([^/?]+)/);
            if (projectIdMatch && projectIdMatch[1]) {
                results.push({
                    "key": "projectId",
                    "field": "Project ID",
                    "value": projectIdMatch[1],
                    "group": "general"
                });
            }
        } else if (url.pathname.includes("/collect")) {
            requestType = "Data Collection";
        } else if (url.pathname.includes("/eventlogger")) {
            requestType = "Event Logging";
        }

        // Set request type
        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}