/**
 * Google Tag Manager
 * https://developers.google.com/tag-manager/
 *
 * @class
 * @extends BaseProvider
 */
import BaseProvider from '../BaseProvider.js';

export default class GoogleTagManagerProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "GOOGLETAGMANAGER";
        this._pattern = /\/\/www\.googletagmanager\.com(?:\/[a-z]+|)\/[a-z]+\.js/;
        this._name = "Google Tag Manager";
        this._type = "tagmanager";
        this._keywords = ["google", "gtm", "tag manager"];
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
                "name": "Container ID",
                "group": "general"
            },
            "l": {
                "name": "Data Layer Name",
                "group": "general"
            },
            "cx": {
                "name": "Container Experiments",
                "group": "general"
            },
            "gcs": {
                "name": "Consent Mode",
                "group": "general"
            },
            "gtm": {
                "name": "GTM Debug",
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
            gtmIdFromPath = url.pathname.match(/\/gtm-(\w+)\.js/);

        // Extract Container ID either from URL params or path pattern
        if (params.has("id")) {
            results.push({
                "key": "id",
                "field": "Container ID",
                "value": params.get("id"),
                "group": "general"
            });
        } else if (gtmIdFromPath) {
            results.push({
                "key": "id",
                "field": "Container ID",
                "value": "GTM-" + gtmIdFromPath[1],
                "group": "general"
            });
        }

        results.push({
            "key": "requestType",
            "value": "Container Load",
            "hidden": true
        });

        // Add the script type
        let scriptType = "Unknown";
        if (url.pathname.includes("/gtag/js")) {
            scriptType = "gtag.js";
        } else if (url.pathname.includes("/gtm.js")) {
            scriptType = "gtm.js";
        } else if (url.pathname.includes("/gtm-preview")) {
            scriptType = "GTM Preview";
        } else if (url.pathname.includes("/ns.html")) {
            scriptType = "GTM No-Script";
        }

        results.push({
            "key": "scriptType",
            "field": "Script Type",
            "value": scriptType,
            "group": "general"
        });

        return results;
    }
}