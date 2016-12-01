YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "WPAPI",
        "WPRequest"
    ],
    "modules": [
        "WPAPI",
        "WPRequest",
        "autodiscovery",
        "filters",
        "http-transport",
        "parseRouteString"
    ],
    "allModules": [
        {
            "displayName": "autodiscovery",
            "name": "autodiscovery",
            "description": "Utility methods used to query a site in order to discover its available\nAPI endpoints"
        },
        {
            "displayName": "filters",
            "name": "filters",
            "description": "Filter methods that can be mixed in to a request constructor's prototype to\nallow that request to take advantage of the `?filter[]=` aliases for WP_Query\nparameters for collection endpoints, when available."
        },
        {
            "displayName": "http-transport",
            "name": "http-transport"
        },
        {
            "displayName": "parseRouteString",
            "name": "parseRouteString",
            "description": "Take a WP route string (with PCRE named capture groups), such as"
        },
        {
            "displayName": "WPAPI",
            "name": "WPAPI",
            "description": "A WP REST API client for Node.js"
        },
        {
            "displayName": "WPRequest",
            "name": "WPRequest",
            "description": "WPRequest is the base API request object constructor"
        }
    ],
    "elements": []
} };
});