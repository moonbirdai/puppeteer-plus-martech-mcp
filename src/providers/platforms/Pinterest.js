/**
 * Pinterest Tag
 * https://developers.pinterest.com/docs/tag/conversion/
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class PinterestProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "PINTEREST";
        this._pattern = /\/\/ct\.pinterest\.com(?:\/v3)?\/user|\/\/ct\.pinterest\.com(?:\/v3)?\/events/;
        this._name = "Pinterest Tag";
        this._type = "marketing";
        this._keywords = ["pinterest", "pintrk"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "tid",
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
                "key": "ecommerce",
                "name": "E-commerce"
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
            "tid": {
                "name": "Tag ID",
                "group": "general"
            },
            "event": {
                "name": "Event Type",
                "group": "general"
            },
            "ed": {
                "name": "Event Data",
                "group": "general"
            },
            "callback": {
                "name": "Callback Function",
                "group": "general"
            },
            "noscript": {
                "name": "No Script Tag",
                "group": "general"
            },
            "np": {
                "name": "Page URL",
                "group": "general"
            },
            "pd[em]": {
                "name": "Email Address",
                "group": "general"
            },
            "pd[fn]": {
                "name": "First Name",
                "group": "general"
            },
            "pd[ln]": {
                "name": "Last Name",
                "group": "general"
            },
            "pd[ge]": {
                "name": "Gender",
                "group": "general"
            },
            "pd[db]": {
                "name": "Date of Birth",
                "group": "general"
            },
            "pd[ph]": {
                "name": "Phone Number",
                "group": "general"
            },
            "pd[ct]": {
                "name": "City",
                "group": "general"
            },
            "pd[st]": {
                "name": "State",
                "group": "general"
            },
            "pd[zp]": {
                "name": "ZIP/Postal Code",
                "group": "general"
            },
            "pd[country]": {
                "name": "Country",
                "group": "general"
            },
            "pd[external_id]": {
                "name": "External ID",
                "group": "general"
            },
            "currency": {
                "name": "Currency",
                "group": "ecommerce"
            },
            "value": {
                "name": "Value",
                "group": "ecommerce"
            },
            "order_id": {
                "name": "Order ID",
                "group": "ecommerce"
            },
            "order_quantity": {
                "name": "Order Quantity",
                "group": "ecommerce"
            },
            "promo_code": {
                "name": "Promo Code",
                "group": "ecommerce"
            },
            "product_id": {
                "name": "Product ID",
                "group": "ecommerce"
            },
            "product_name": {
                "name": "Product Name",
                "group": "ecommerce"
            },
            "product_category": {
                "name": "Product Category",
                "group": "ecommerce"
            },
            "product_brand": {
                "name": "Product Brand",
                "group": "ecommerce"
            },
            "product_variant": {
                "name": "Product Variant",
                "group": "ecommerce"
            },
            "product_variant_id": {
                "name": "Product Variant ID",
                "group": "ecommerce"
            },
            "product_price": {
                "name": "Product Price",
                "group": "ecommerce"
            },
            "product_quantity": {
                "name": "Product Quantity",
                "group": "ecommerce"
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
        // Handle custom data parameters
        if (name.startsWith("custom_data[")) {
            const customKey = name.match(/custom_data\[([^\]]+)\]/);
            if (customKey && customKey[1]) {
                return {
                    "key": name,
                    "field": `Custom: ${customKey[1]}`,
                    "value": value,
                    "group": "custom"
                };
            }
        }
        
        // Handle event data
        if (name === "ed") {
            try {
                const data = JSON.parse(decodeURIComponent(value));
                return {
                    "key": name,
                    "field": "Event Data (JSON)",
                    "value": JSON.stringify(data, null, 2),
                    "group": "general"
                };
            } catch (e) {
                // If it's not valid JSON, treat as a regular parameter
                return super.handleQueryParam(name, value);
            }
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

        // Try to extract tag ID if not in the parameters
        if (!params.has("tid")) {
            const tagIdMatch = url.pathname.match(/\/user\/([^/]+)\//);
            if (tagIdMatch && tagIdMatch[1]) {
                results.push({
                    "key": "tid",
                    "field": "Tag ID",
                    "value": tagIdMatch[1],
                    "group": "general"
                });
            }
        }

        // If event data parameter exists, extract properties
        if (params.has("ed")) {
            try {
                const data = JSON.parse(decodeURIComponent(params.get("ed")));
                
                // Extract ecommerce data
                for (const [key, value] of Object.entries(data)) {
                    if (this.keys[key]) {
                        results.push({
                            "key": key,
                            "field": this.keys[key].name,
                            "value": typeof value === "object" ? JSON.stringify(value) : value,
                            "group": this.keys[key].group
                        });
                    } else {
                        results.push({
                            "key": `custom_data[${key}]`,
                            "field": `Custom: ${key}`,
                            "value": typeof value === "object" ? JSON.stringify(value) : value,
                            "group": "custom"
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