/**
 * Adobe Experience Platform Web SDK (Alloy)
 * Implementation based on AdobeWebSdk provider for Omnibug
 */
import BaseProvider from '../BaseProvider.js';

class AdobeWebSdkProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "ADOBEWEBSDK";
        this._pattern = /\/(ee|edge|interact|collect)\/v1\/interact/;
        this._name = "Adobe Experience Platform Web SDK";
        this._type = "analytics";
        this._keywords = ["aep", "alloy", "xdm", "web sdk"];
    }

    /**
     * Retrieve the column mappings for default columns
     */
    get columnMapping() {
        return {
            "account": "configId",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "xdm",
                "name": "XDM Data"
            },
            {
                "key": "identity",
                "name": "Identity"
            },
            {
                "key": "target",
                "name": "Target"
            },
            {
                "key": "analytics",
                "name": "Analytics"
            },
            {
                "key": "other",
                "name": "Other"
            }
        ];
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string} rawUrl - A URL to check against
     * @param {string} postData - POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "") {
        let data = [];
        const url = new URL(rawUrl);
        let requestType = "Interact";

        // Get basic URL data
        data.push({
            "key": "endpoint",
            "field": "Endpoint",
            "value": url.hostname,
            "group": "general"
        });

        // Add tracking server info
        data.push({
            "key": "trackingServer",
            "field": "Tracking Server",
            "value": url.hostname,
            "group": "general"
        });

        // Parse the POST data for Alloy requests
        if (postData) {
            try {
                // If postData is a string, parse it as JSON
                const postDataObj = typeof postData === "string" ? 
                    JSON.parse(postData) : postData;
                
                // Process the POST data
                data = data.concat(this.processPostData(postDataObj));
            } catch (e) {
                data.push({
                    "key": "error",
                    "field": "Error Parsing Request",
                    "value": e.message,
                    "group": "other"
                });
            }
        }
        
        // Add request type
        data.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return {
            "provider": {
                "name": this.name,
                "key": this.key,
                "type": this.type,
                "columns": this.columnMapping,
                "groups": this.groups
            },
            "data": data
        };
    }

    /**
     * Process POST data from the Alloy request
     * 
     * @param {Object} postData - The parsed POST data
     * @return {Array} An array of parsed data items
     */
    processPostData(postData) {
        const results = [];

        // Extract events array
        if (postData.events && Array.isArray(postData.events)) {
            const eventData = postData.events;
            
            // Add config ID if available
            if (postData.configId) {
                results.push({
                    "key": "configId",
                    "field": "Configuration ID",
                    "value": postData.configId,
                    "group": "general"
                });
            }

            // Process each event
            eventData.forEach((event, index) => {
                // Add event type
                if (event.eventType) {
                    results.push({
                        "key": `events[${index}].eventType`,
                        "field": `Event Type (${index})`,
                        "value": event.eventType,
                        "group": "general"
                    });
                }

                // Process XDM data
                if (event.xdm) {
                    const xdmResults = this.processXdmObject(event.xdm, `events[${index}].xdm`, 0);
                    results.push(...xdmResults);
                }

                // Process data
                if (event.data) {
                    const dataResults = this.processXdmObject(event.data, `events[${index}].data`, 0);
                    results.push(...dataResults);
                }

                // Meta & query data
                if (event.meta) {
                    const metaResults = this.processXdmObject(event.meta, `events[${index}].meta`, 0);
                    results.push(...metaResults);
                }

                if (event.query) {
                    const queryResults = this.processXdmObject(event.query, `events[${index}].query`, 0);
                    results.push(...queryResults);
                }
            });
        }

        return results;
    }

    /**
     * Recursively process XDM objects to extract all keys
     * 
     * @param {Object} obj - The object to process
     * @param {string} prefix - Key prefix for nested properties
     * @param {number} depth - Current recursion depth
     * @return {Array} Array of processed data items
     */
    processXdmObject(obj, prefix = "", depth = 0) {
        // Prevent excessive recursion
        if (depth > 10) {
            return [{
                "key": `${prefix}.maxDepthExceeded`,
                "field": `${prefix} (Max Depth Exceeded)`,
                "value": "Object too deep to display fully",
                "group": "xdm"
            }];
        }

        let results = [];

        // Process each property in the object
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            // Get the appropriate group based on key
            let group = "xdm";
            if (key.includes("analytics") || fullKey.includes("analytics")) {
                group = "analytics";
            } else if (key.includes("target") || fullKey.includes("target")) {
                group = "target";
            } else if (key.includes("identity") || key === "ECID" || fullKey.includes("identity")) {
                group = "identity";
            } else if (prefix.includes("__adobe")) {
                // Special handling for Adobe namespaces
                if (prefix.includes("target")) {
                    group = "target";
                } else if (prefix.includes("analytics")) {
                    group = "analytics";
                }
            }

            // Format the field name to be more readable
            const fieldName = key;

            if (value === null) {
                // Handle null values
                results.push({
                    "key": fullKey,
                    "field": fieldName,
                    "value": "null",
                    "group": group
                });
            } else if (typeof value === "object" && !Array.isArray(value)) {
                // Recursively process nested objects
                const nestedResults = this.processXdmObject(value, fullKey, depth + 1);
                results = results.concat(nestedResults);
            } else if (Array.isArray(value)) {
                // Handle arrays - if simple values, join them; if objects, process each
                if (value.length === 0) {
                    results.push({
                        "key": fullKey,
                        "field": fieldName,
                        "value": "[]",
                        "group": group
                    });
                } else if (typeof value[0] === "object") {
                    // For arrays of objects, process each one
                    value.forEach((item, idx) => {
                        if (typeof item === "object" && item !== null) {
                            const arrayResults = this.processXdmObject(item, `${fullKey}[${idx}]`, depth + 1);
                            results = results.concat(arrayResults);
                        } else {
                            results.push({
                                "key": `${fullKey}[${idx}]`,
                                "field": `${fieldName}[${idx}]`,
                                "value": String(item),
                                "group": group
                            });
                        }
                    });
                } else {
                    // For simple value arrays, join them
                    results.push({
                        "key": fullKey,
                        "field": fieldName,
                        "value": value.join(", "),
                        "group": group
                    });
                }
            } else {
                // Handle simple values (strings, numbers, booleans)
                results.push({
                    "key": fullKey,
                    "field": fieldName,
                    "value": String(value),
                    "group": group
                });
            }
        }

        return results;
    }
}

export default AdobeWebSdkProvider;