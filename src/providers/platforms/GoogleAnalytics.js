/**
 * Google Analytics (Universal Analytics)
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class GoogleAnalyticsProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "GOOGLEANALYTICS";
        this._pattern = /\.google-analytics\.com\/(?:r\/)?collect(?:[/?]|$)|\.google-analytics\.com\/(?:j\/)?collect(?:[/?]|$)|\.google-analytics\.com\/(?:mp\/)?collect(?:[/?]|$)|stats\.g\.doubleclick\.net\/(?:r\/)?collect(?:[/?]|$)|analytics\.google\.com\/(?:g\/)?collect(?:[/?]|$)/;
        this._name = "Google Analytics (Universal)";
        this._type = "analytics";
        this._keywords = ["google", "analytics", "ua", "universal analytics"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "tid",
            "requestType": "omnibug_requestType"
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
                "key": "campaign",
                "name": "Campaign"
            },
            {
                "key": "events",
                "name": "Events"
            },
            {
                "key": "ecommerce",
                "name": "Ecommerce"
            },
            {
                "key": "timing",
                "name": "Timing"
            },
            {
                "key": "dimensions",
                "name": "Custom Dimensions"
            },
            {
                "key": "metrics",
                "name": "Custom Metrics"
            },
            {
                "key": "contentgroup",
                "name": "Content Groups"
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
            "v": {
                "name": "Protocol Version",
                "group": "general"
            },
            "tid": {
                "name": "Tracking ID",
                "group": "general"
            },
            "aip": {
                "name": "Anonymize IP",
                "group": "general"
            },
            "qt": {
                "name": "Queue Time",
                "group": "general"
            },
            "z": {
                "name": "Cache Buster",
                "group": "general"
            },
            "cid": {
                "name": "Client ID",
                "group": "general"
            },
            "sc": {
                "name": "Session Control",
                "group": "general"
            },
            "dr": {
                "name": "Document Referrer",
                "group": "general"
            },
            "cn": {
                "name": "Campaign Name",
                "group": "campaign"
            },
            "cs": {
                "name": "Campaign Source",
                "group": "campaign"
            },
            "cm": {
                "name": "Campaign Medium",
                "group": "campaign"
            },
            "ck": {
                "name": "Campaign Keyword",
                "group": "campaign"
            },
            "cc": {
                "name": "Campaign Content",
                "group": "campaign"
            },
            "ci": {
                "name": "Campaign ID",
                "group": "campaign"
            },
            "gclid": {
                "name": "Google AdWords ID",
                "group": "campaign"
            },
            "dclid": {
                "name": "Google Display Ads ID",
                "group": "campaign"
            },
            "sr": {
                "name": "Screen Resolution",
                "group": "general"
            },
            "vp": {
                "name": "Viewport Size",
                "group": "general"
            },
            "de": {
                "name": "Document Encoding",
                "group": "general"
            },
            "sd": {
                "name": "Screen Colors",
                "group": "general"
            },
            "ul": {
                "name": "User Language",
                "group": "general"
            },
            "je": {
                "name": "Java Enabled",
                "group": "general"
            },
            "fl": {
                "name": "Flash Version",
                "group": "general"
            },
            "t": {
                "name": "Hit Type",
                "group": "general"
            },
            "ni": {
                "name": "Non-Interaction Hit",
                "group": "events"
            },
            "dl": {
                "name": "Document location URL",
                "group": "general"
            },
            "dh": {
                "name": "Document Host Name",
                "group": "general"
            },
            "dp": {
                "name": "Document Path",
                "group": "general"
            },
            "dt": {
                "name": "Document Title",
                "group": "general"
            },
            "cd": {
                "name": "Content Description",
                "group": "general"
            },
            "an": {
                "name": "Application Name",
                "group": "general"
            },
            "av": {
                "name": "Application Version",
                "group": "general"
            },
            "ec": {
                "name": "Event Category",
                "group": "events"
            },
            "ea": {
                "name": "Event Action",
                "group": "events"
            },
            "el": {
                "name": "Event Label",
                "group": "events"
            },
            "ev": {
                "name": "Event Value",
                "group": "events"
            },
            "ta": {
                "name": "Transaction Affiliation",
                "group": "ecommerce"
            },
            "tr": {
                "name": "Transaction Revenue",
                "group": "ecommerce"
            },
            "ts": {
                "name": "Transaction Shipping",
                "group": "ecommerce"
            },
            "tt": {
                "name": "Transaction Tax",
                "group": "ecommerce"
            },
            "ti": {
                "name": "Transaction ID",
                "group": "ecommerce"
            },
            "in": {
                "name": "Item Name",
                "group": "ecommerce"
            },
            "ip": {
                "name": "Item Price",
                "group": "ecommerce"
            },
            "iq": {
                "name": "Item Quantity",
                "group": "ecommerce"
            },
            "ic": {
                "name": "Item Code",
                "group": "ecommerce"
            },
            "iv": {
                "name": "Item Category",
                "group": "ecommerce"
            },
            "cu": {
                "name": "Currency Code",
                "group": "ecommerce"
            },
            "sn": {
                "name": "Social Network",
                "group": "events"
            },
            "sa": {
                "name": "Social Action",
                "group": "events"
            },
            "st": {
                "name": "Social Action Target",
                "group": "events"
            },
            "utc": {
                "name": "User Timing Category",
                "group": "timing"
            },
            "utv": {
                "name": "User Timing Variable Name",
                "group": "timing"
            },
            "utt": {
                "name": "User Timing Time",
                "group": "timing"
            },
            "utl": {
                "name": "User timing Label",
                "group": "timing"
            },
            "plt": {
                "name": "Page load time",
                "group": "timing"
            },
            "dns": {
                "name": "DNS time",
                "group": "timing"
            },
            "pdt": {
                "name": "Page download time",
                "group": "timing"
            },
            "rrt": {
                "name": "Redirect response time",
                "group": "timing"
            },
            "tcp": {
                "name": "TCP connect time",
                "group": "timing"
            },
            "srt": {
                "name": "Server response time",
                "group": "timing"
            },
            "exd": {
                "name": "Exception description",
                "group": "events"
            },
            "exf": {
                "name": "Is exception fatal?",
                "group": "events"
            },
            "ds": {
                "name": "Data Source",
                "group": "general"
            },
            "uid": {
                "name": "User ID",
                "group": "general"
            },
            "linkid": {
                "name": "Link ID",
                "group": "general"
            },
            "pa": {
                "name": "Product Action",
                "group": "ecommerce"
            },
            "tcc": {
                "name": "Coupon Code",
                "group": "ecommerce"
            },
            "pal": {
                "name": "Product Action List",
                "group": "ecommerce"
            },
            "cos": {
                "name": "Checkout Step",
                "group": "ecommerce"
            },
            "col": {
                "name": "Checkout Step Option",
                "group": "ecommerce"
            },
            "promoa": {
                "name": "Promotion Action",
                "group": "ecommerce"
            },
            "_r": {
                "name": "Display Features Enabled",
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
        let result = {};
        
        // Handle Content Groups
        if (/^cg(\d+)$/i.test(name)) {
            result = {
                "key": name,
                "field": `Content Group ${RegExp.$1}`,
                "value": value,
                "group": "contentgroup"
            };
        }
        // Handle Custom Dimensions
        else if (/^cd(\d+)$/i.test(name)) {
            result = {
                "key": name,
                "field": `Dimension ${RegExp.$1}`,
                "value": value,
                "group": "dimensions"
            };
        }
        // Handle Custom Metrics
        else if (/^cm(\d+)$/i.test(name)) {
            result = {
                "key": name,
                "field": `Metric ${RegExp.$1}`,
                "value": value,
                "group": "metrics"
            };
        }
        // Handle Promotion parameters
        else if (/^promo(\d+)([a-z]{2})$/i.test(name)) {
            let lookup = {
                "id": "ID",
                "nm": "Name",
                "cr": "Creative",
                "ps": "Position"
            },
                type = lookup[RegExp.$2] || "";
            result = {
                "key": name,
                "field": `Promotion ${RegExp.$1} ${type}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        // Handle Product parameters
        else if (/^pr(\d+)([a-z]{2})$/i.test(name)) {
            let lookup = {
                "id": "ID",
                "nm": "Name",
                "br": "Brand",
                "ca": "Category",
                "va": "Variant",
                "pr": "Price",
                "qt": "Quantity",
                "cc": "Coupon Code",
                "ps": "Position"
            },
                type = lookup[RegExp.$2] || "";
            result = {
                "key": name,
                "field": `Product ${RegExp.$1} ${type}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        // Handle Product Custom Dimensions and Metrics
        else if (/^pr(\d+)(cd|cm)(\d+)$/i.test(name)) {
            let lookup = {
                "cd": "Dimension",
                "cm": "Metric"
            },
                type = lookup[RegExp.$2] || "";
            result = {
                "key": name,
                "field": `Product ${RegExp.$1} ${type} ${RegExp.$3}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        // Handle Impression List
        else if (/^il(\d+)nm$/i.test(name)) {
            result = {
                "key": name,
                "field": `Impression List ${RegExp.$1}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        // Handle Impression List Product Custom Dimensions and Metrics
        else if (/^il(\d+)pi(\d+)(cd|cm)(\d+)$/i.test(name)) {
            let lookup = {
                "cd": "Dimension",
                "cm": "Metric"
            },
                type = lookup[RegExp.$3] || "";
            result = {
                "key": name,
                "field": `Impression List ${RegExp.$1} Product ${RegExp.$2} ${type} ${RegExp.$4}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        // Handle Impression List Product parameters
        else if (/^il(\d+)pi(\d+)([a-z]{2})$/i.test(name)) {
            let lookup = {
                "id": "ID",
                "nm": "Name",
                "br": "Brand",
                "ca": "Category",
                "va": "Variant",
                "pr": "Price",
                "ps": "Position"
            },
                type = lookup[RegExp.$3] || "";
            result = {
                "key": name,
                "field": `Impression List ${RegExp.$1} Product ${RegExp.$2} ${type}`,
                "value": value,
                "group": "ecommerce"
            };
        }
        else {
            result = super.handleQueryParam(name, value);
        }
        return result;
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
            requestType = "";

        results.push({
            "key": "omnibug_hostname",
            "value": url.hostname,
            "field": "Google Analytics Host",
            "group": "general"
        });

        // Determine the request type
        if (params.has("t")) {
            const hitType = params.get("t").toLowerCase();
            
            if (hitType === "pageview") {
                requestType = "Page View";
            } else if (hitType === "event") {
                requestType = "Event";
            } else if (hitType === "transaction") {
                requestType = "Transaction";
            } else if (hitType === "item") {
                requestType = "Item";
            } else if (hitType === "social") {
                requestType = "Social";
            } else if (hitType === "timing") {
                requestType = "Timing";
            } else if (hitType === "exception") {
                requestType = "Exception";
            } else {
                requestType = hitType.charAt(0).toUpperCase() + hitType.slice(1);
            }
        } else {
            requestType = "Other";
        }

        results.push({
            "key": "omnibug_requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}