YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CollectionRequest",
        "MediaRequest",
        "PagesRequest",
        "PostsRequest",
        "TaxonomiesRequest",
        "TypesRequest",
        "UsersRequest",
        "WP",
        "WPRequest"
    ],
    "modules": [
        "CollectionRequest",
        "MediaRequest",
        "PagesRequest",
        "PostsRequest",
        "TaxonomiesRequest",
        "TypesRequest",
        "UsersRequest",
        "WP",
        "WPRequest"
    ],
    "allModules": [
        {
            "displayName": "CollectionRequest",
            "name": "CollectionRequest",
            "description": "CollectionRequest extends WPRequest with properties & methods for filtering collections\nvia query parameters. It is the base constructor for most top-level WP instance methods."
        },
        {
            "displayName": "MediaRequest",
            "name": "MediaRequest",
            "description": "MediaRequest extends CollectionRequest to handle the /media API endpoint"
        },
        {
            "displayName": "PagesRequest",
            "name": "PagesRequest",
            "description": "PagesRequest extends CollectionRequest to handle the /posts API endpoint"
        },
        {
            "displayName": "PostsRequest",
            "name": "PostsRequest",
            "description": "PostsRequest extends CollectionRequest to handle the /posts API endpoint"
        },
        {
            "displayName": "TaxonomiesRequest",
            "name": "TaxonomiesRequest",
            "description": "TaxonomiesRequest extends CollectionRequest to handle the /taxonomies API endpoint"
        },
        {
            "displayName": "TypesRequest",
            "name": "TypesRequest",
            "description": "TypesRequest extends CollectionRequest to handle the /taxonomies API endpoint"
        },
        {
            "displayName": "UsersRequest",
            "name": "UsersRequest",
            "description": "UsersRequest extends CollectionRequest to handle the `/users` API endpoint. The `/users`\nendpoint responds with a 401 error without authentication, so `users()` forces basic auth."
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