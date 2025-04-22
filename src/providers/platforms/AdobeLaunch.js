/**
 * Adobe Experience Platform Launch
 * https://business.adobe.com/products/experience-platform/launch.html
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class AdobeLaunchProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "ADOBELAUNCH";
        this._pattern = /\/\/assets\.adobedtm\.com\/launch-[a-zA-Z0-9]+-development\.min\.js|\/\/assets\.adobedtm\.com\/launch-[a-zA-Z0-9]+-staging\.min\.js|\/\/assets\.adobedtm\.com\/launch-[a-zA-Z0-9]+\.min\.js|\/\/assets\.adobedtm\.com\/[^\/]+\/[^\/]+\/launch-[a-f0-9]+(-development|-staging|)\.min\.js/;
        this._name = "Adobe Experience Platform Launch";
        this._type = "tagmanager";
        this._keywords = ["launch", "adobe", "tag manager", "dtm", "aep"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "property",
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
            "property": {
                "name": "Property",
                "group": "general"
            },
            "environment": {
                "name": "Environment",
                "group": "general"
            },
            "company": {
                "name": "Company",
                "group": "general"
            },
            "requestType": {
                "hidden": true
            }
        };
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
            urlPath = url.pathname,
            company = "",
            property = "",
            environment = "production";

        results.push({
            "key": "requestType",
            "value": "Library Load",
            "hidden": true
        });

        // Extract property and environment from the URL
        if (/\/launch-([a-zA-Z0-9]+)(?:-(development|staging))?\.min\.js/.test(urlPath)) {
            property = RegExp.$1;
            environment = RegExp.$2 || "production";
        } else if (/\/([^\/]+)\/([^\/]+)\/launch-([a-f0-9]+)(?:-(development|staging))?\.min\.js/.test(urlPath)) {
            company = RegExp.$1;
            property = RegExp.$3;
            environment = RegExp.$4 || "production";

            results.push({
                "key": "company",
                "field": "Company",
                "value": company,
                "group": "general"
            });
        }

        if (property) {
            results.push({
                "key": "property",
                "field": "Property",
                "value": property,
                "group": "general"
            });
        }

        results.push({
            "key": "environment",
            "field": "Environment",
            "value": environment,
            "group": "general"
        });

        return results;
    }
}