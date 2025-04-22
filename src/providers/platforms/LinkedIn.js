/**
 * LinkedIn Insight Tag
 * https://business.linkedin.com/marketing-solutions/insight-tag
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class LinkedInProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "LINKEDIN";
        this._pattern = /\/\/px\.ads\.linkedin\.com\/collect|\/\/snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js|\/\/platform\.linkedin\.com/;
        this._name = "LinkedIn Insight Tag";
        this._type = "marketing";
        this._keywords = ["linkedin", "insight tag"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "pid",
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
                "key": "conversion",
                "name": "Conversion"
            },
            {
                "key": "custom",
                "name": "Custom Parameters"
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
            "pid": {
                "name": "Partner ID",
                "group": "general"
            },
            "conversionId": {
                "name": "Conversion ID",
                "group": "conversion"
            },
            "fmt": {
                "name": "Format",
                "group": "general"
            },
            "time": {
                "name": "Timestamp",
                "group": "general"
            },
            "url": {
                "name": "Page URL",
                "group": "general"
            },
            "e": {
                "name": "Event",
                "group": "general"
            },
            "pc": {
                "name": "Page Category",
                "group": "general"
            },
            "pn": {
                "name": "Page Name",
                "group": "general"
            },
            "pi": {
                "name": "Page ID",
                "group": "general"
            },
            "pt": {
                "name": "Page Title",
                "group": "general"
            },
            "tl": {
                "name": "Page Type",
                "group": "general"
            },
            "v": {
                "name": "Version",
                "group": "general"
            },
            "s": {
                "name": "Screen Size",
                "group": "general"
            },
            "td": {
                "name": "Time On Page",
                "group": "general"
            },
            "li": {
                "name": "LinkedIn Member",
                "group": "general"
            },
            "li_fat_id": {
                "name": "LinkedIn Member ID",
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
        // Handle custom parameters
        if (/^d\[(\w+)]$/.test(name)) {
            const customKey = RegExp.$1;
            return {
                "key": name,
                "field": `Custom: ${customKey}`,
                "value": value,
                "group": "custom"
            };
        }
        
        // Handle conversion values
        if (/^cv\[(\w+)]$/.test(name)) {
            const convKey = RegExp.$1;
            return {
                "key": name,
                "field": `Conversion: ${convKey}`,
                "value": value,
                "group": "conversion"
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
            requestType = params.get("e") || "PageView";

        // Handle script loads differently
        if (url.href.includes("insight.min.js")) {
            // Extract partner ID from script URL
            const partnerIdMatch = url.search.match(/(?:\?|&)pid=([^&]+)/);
            if (partnerIdMatch && partnerIdMatch[1]) {
                results.push({
                    "key": "pid",
                    "field": "Partner ID",
                    "value": partnerIdMatch[1],
                    "group": "general"
                });
            }
            
            requestType = "Script Load";
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