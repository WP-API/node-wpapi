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
        "object-reduce",
        "parseRouteString"
    ],
    "allModules": [
        {
            "displayName": "autodiscovery",
            "name": "autodiscovery",
            "description": "Utility methods used when querying a site in order to discover its available\nAPI endpoints"
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
            "displayName": "object-reduce",
            "name": "object-reduce",
            "description": "Utility method to permit Array#reduce-like operations over objects\n\nThis is likely to be slightly more inefficient than using lodash.reduce,\nbut results in ~50kb less size in the resulting bundled code before\nminification and ~12kb of savings with minification.\n\nUnlike lodash.reduce(), the iterator and initial value properties are NOT\noptional: this is done to simplify the code, this module is not intended to\nbe a full replacement for lodash.reduce and instead prioritizes simplicity\nfor a specific common case."
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