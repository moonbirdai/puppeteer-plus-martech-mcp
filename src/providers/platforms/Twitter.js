/**
 * Twitter/X Pixel
 * https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class TwitterProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "TWITTER";
        this._pattern = /\/\/static\.ads-twitter\.com\/uwt\.js|\/\/analytics\.twitter\.com\/i\/adsct|\/\/t\.co\/i\/adsct|\/\/platform\.twitter\.com\/widgets\.js/;
        this._name = "Twitter/X Pixel";
        this._type = "marketing";
        this._keywords = ["twitter", "x", "pixel", "uwt"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "txn_id",
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
            "txn_id": {
                "name": "Pixel ID",
                "group": "general"
            },
            "tw_sale_amount": {
                "name": "Sale Amount",
                "group": "ecommerce"
            },
            "tw_order_quantity": {
                "name": "Order Quantity",
                "group": "ecommerce"
            },
            "tw_iframe_status": {
                "name": "iFrame Status",
                "group": "general"
            },
            "tw_document_href": {
                "name": "Document URL",
                "group": "general"
            },
            "tpx_cb": {
                "name": "Callback",
                "group": "general"
            },
            "p_id": {
                "name": "Product ID",
                "group": "ecommerce"
            },
            "p_user_id": {
                "name": "User ID",
                "group": "general"
            },
            "p_user_latlng": {
                "name": "User Location",
                "group": "general"
            },
            "p_user_email": {
                "name": "User Email",
                "group": "general"
            },
            "tw_event": {
                "name": "Event Name",
                "group": "general"
            },
            "cd[content_name]": {
                "name": "Content Name",
                "group": "custom"
            },
            "cd[content_type]": {
                "name": "Content Type",
                "group": "custom"
            },
            "cd[content_ids]": {
                "name": "Content IDs",
                "group": "custom"
            },
            "cd[num_items]": {
                "name": "Number of Items",
                "group": "ecommerce"
            },
            "cd[email]": {
                "name": "Email",
                "group": "custom"
            },
            "cd[phone]": {
                "name": "Phone",
                "group": "custom"
            },
            "cd[address]": {
                "name": "Address",
                "group": "custom"
            },
            "cd[description]": {
                "name": "Description",
                "group": "custom"
            },
            "cd[currency]": {
                "name": "Currency",
                "group": "ecommerce"
            },
            "cd[value]": {
                "name": "Value",
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
        if (/^cd\[([^\]]+)]$/.test(name)) {
            const customKey = RegExp.$1;
            const existingKey = this.keys[name];
            
            if (existingKey) {
                return {
                    "key": name,
                    "field": existingKey.name,
                    "value": value,
                    "group": existingKey.group
                };
            }
            
            return {
                "key": name,
                "field": `Custom: ${customKey}`,
                "value": value,
                "group": "custom"
            };
        }

        // Handle events parameter
        if (name === "events") {
            try {
                const events = JSON.parse(decodeURIComponent(value));
                return {
                    "key": name,
                    "field": "Events (JSON)",
                    "value": JSON.stringify(events, null, 2),
                    "group": "general"
                };
            } catch (e) {
                // If parsing fails, handle as regular parameter
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
            requestType = "Pixel";

        // Determine the request type based on the URL pattern
        if (url.href.includes("uwt.js")) {
            requestType = "Script Load";
        } else if (url.href.includes("widgets.js")) {
            requestType = "Widget Script";
        } else if (params.has("tw_event")) {
            requestType = params.get("tw_event");
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