YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CollectionFilters",
        "PostsRequest",
        "TaxonomiesRequest",
        "UsersRequest",
        "WP",
        "WPRequest"
    ],
    "modules": [
        "CollectionFilters",
        "PostsRequest",
        "TaxonomiesRequest",
        "UsersRequest",
        "WP",
        "WPRequest"
    ],
    "allModules": [
        {
            "displayName": "CollectionFilters",
            "name": "CollectionFilters",
            "description": "CollectionFilters' \"mixins\" object is intended to extend endpoint modules' prototypes"
        },
        {
            "displayName": "PostsRequest",
            "name": "PostsRequest",
            "description": "PostsRequest extends WPRequest to handle the /posts API endpoint"
        },
        {
            "displayName": "TaxonomiesRequest",
            "name": "TaxonomiesRequest",
            "description": "TaxonomiesRequest extends WPRequest to handle the /taxonomies API endpoint"
        },
        {
            "displayName": "UsersRequest",
            "name": "UsersRequest",
            "description": "UsersRequest extends WPRequest to handle the /users API endpoint"
        },
        {
            "displayName": "WP",
            "name": "WP",
            "description": "A WP REST API client for Node.js"
        },
        {
            "displayName": "WPRequest",
            "name": "WPRequest",
            "description": "WPRequest is the base API request object constructor"
        }
    ]
} };
});