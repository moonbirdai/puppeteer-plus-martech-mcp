/**
 * Generic Base Provider for analytics detection
 * Adapted from Omnibug's BaseProvider
 *
 * @class
 */
export default class BaseProvider {
    constructor() {
        this._key = "";       // Unique identifier for the provider
        this._pattern = /.*/; // RegExp pattern for URL detection
        this._name = "";      // Human-readable name
        this._type = "";      // Type of service (analytics, tagmanager, etc.)
        this._keywords = [];  // Keywords for searching
    }

    /**
     * Get the Provider's key
     *
     * @returns {string}
     */
    get key() {
        return this._key;
    }

    /**
     * Get the Provider's type category
     *
     * @returns {string}
     */
    get type() {
        const types = {
            "analytics": "Analytics",
            "customer": "Customer Engagement",
            "testing": "UX Testing",
            "tagmanager": "Tag Manager",
            "visitorid": "Visitor Identification",
            "marketing": "Marketing",
            "replay": "Session Replay/Heat Maps"
        };
        return types[this._type] || "Unknown";
    }

    /**
     * Retrieve the keywords for searching
     *
     * @returns {[]}
     */
    get keywords() {
        return this._keywords;
    }

    /**
     * Get the Provider's RegExp pattern
     *
     * @returns {RegExp}
     */
    get pattern() {
        return this._pattern;
    }

    /**
     * Get the Provider's name
     *
     * @returns {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {};
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {};
    }

    /**
     * Check if this provider should parse the given URL
     *
     * @param {string}  rawUrl   A URL to check against
     *
     * @returns {Boolean}
     */
    checkUrl(rawUrl) {
        return this.pattern.test(rawUrl);
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl      A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "") {
        let url, data = [], params, postParams;
        
        try {
            url = new URL(rawUrl);
            params = new URLSearchParams(url.search);
            postParams = this.parsePostData(postData);
        } catch (e) {
            console.error(`Error parsing URL ${rawUrl}: ${e.message}`);
            return {
                "provider": {
                    "name": this.name,
                    "key": this.key,
                    "type": this.type,
                    "columns": this.columnMapping,
                    "groups": this.groups
                },
                "data": [],
                "error": e.message
            };
        }

        // Handle POST data first, if applicable (treat as query params)
        postParams.forEach((pair) => {
            params.append(pair[0], pair[1]);
        });

        for (let param of params) {
            let key = param[0],
                value = param[1],
                result = this.handleQueryParam(key, value);
            if (typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url, params);
        if (typeof customData === "object" && customData !== null) {
            if (Array.isArray(customData)) {
                data = data.concat(customData);
            } else {
                data.push(customData);
            }
        }

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
     * Parse any POST data into param key/value pairs
     *
     * @param postData
     * @return {Array|Object}
     */
    parsePostData(postData = "") {
        let params = [];
        
        if (typeof postData === "string" && postData) {
            try {
                // First try to parse as JSON
                const parsed = JSON.parse(postData);
                
                /* Flatten nested JSON based on https://stackoverflow.com/a/19101235 */
                const recurse = (cur, prop) => {
                    if (Object(cur) !== cur) {
                        params.push([prop, cur]);
                    } else if (Array.isArray(cur)) {
                        for (let i = 0, l = cur.length; i < l; i++) {
                            recurse(cur[i], prop + "[" + i + "]");
                        }
                        if (cur.length === 0) {
                            params.push([prop, ""]);
                        }
                    } else {
                        let isEmpty = true;
                        for (let p in cur) {
                            if (!Object.prototype.hasOwnProperty.call(cur, p)) {
                                continue;
                            }
                            isEmpty = false;
                            recurse(cur[p], prop ? prop + "." + p : p);
                        }
                        if (isEmpty && prop) {
                            params.push([prop, ""]);
                        }
                    }
                };
                
                recurse(parsed, "");
            } catch (e) {
                // If not JSON, try to parse as form data (key=value&key2=value2)
                try {
                    const keyPairs = postData.split("&");
                    keyPairs.forEach((keyPair) => {
                        const splitPair = keyPair.split("=");
                        params.push([splitPair[0], decodeURIComponent(splitPair[1] || "")]);
                    });
                } catch (e2) {
                    console.error("Error parsing POST data:", e2.message);
                }
            }
        } else if (typeof postData === "object" && postData) {
            // Form data type
            Object.entries(postData).forEach((entry) => {
                params.push([entry[0], entry[1].toString()]);
            });
        }
        
        return params;
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     * @returns {{}}
     */
    handleQueryParam(name, value) {
        let param = this.keys[name] || {};
        if (!param.hidden) {
            return {
                "key": name,
                "field": param.name || name,
                "value": value,
                "group": param.group || "other"
            };
        }
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {URL}     url
     * @param    {URLSearchParams}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params) {
        // To be implemented by subclasses
    }
}
