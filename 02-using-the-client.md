---
layout: page
title: Using the Client
permalink: /using-the-client/
---

* TOC
{:toc}

The module is a constructor, so you can create an instance of the API client bound to the endpoint for your WordPress install:

```javascript
var WP = require( 'wpapi' );
var wp = new WP({ endpoint: 'http://src.wordpress-develop.dev/wp-json' });
```
Once an instance is constructed, you can chain off of it to construct a specific request. (Think of it as a query-builder for WordPress!)

We support requesting posts using either a callback-style or promise-style syntax:

```javascript
// Callbacks
wp.posts().get(function( err, data ) {
    if ( err ) {
        // handle err
    }
    // do something with the returned posts
});

// Promises
wp.posts().then(function( data ) {
    // do something with the returned posts
}).catch(function( err ) {
    // handle error
});
```
The `wp` object will have endpoint handler methods for every endpoint that ships with the default WordPress REST API plugin.

### Self-signed (Insecure) HTTPS Certificates

In a case where you would want to connect to a HTTPS WordPress installation that has a self-signed certificate (insecure), you will need to force a connection by placing the following line before you make any `wp` calls.

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
```

### Auto-Discovery

It is also possible to leverage the [capability discovery](http://v2.wp-api.org/guide/discovery/) features of the API to automatically detect and add setter methods for your custom routes, or routes added by plugins.

To utilize the auto-discovery functionality, call `WP.discover()` with a URL within a WordPress REST API-enabled site:

```js
var apiPromise = WP.discover( 'http://my-site.com' );
```
If auto-discovery succeeds this method returns a promise that will be resolved with a WP client instance object configured specifically for your site. You can use that promise as the queue that your client instance is ready, then use the client normally within the `.then` callback.

**Custom Routes** will be detected by this process, and registered on the client. To prevent name conflicts, only routes in the `wp/v2` namespace will be bound to your instance object itself. The rest can be accessed through the `.namespace` method on the WP instance, as demonstrated below.

```js
apiPromise.then(function( site ) {
    // If default routes were detected, they are now available
    site.posts().then(function( posts ) {
        console.log( posts );
    }); // etc

    // If custom routes were detected, they can be accessed via .namespace()
    site.namespace( 'myplugin/v1' ).authors()
        .then(function( authors ) { /* ... */ });

    // Namespaces can be saved out to variables:
    var myplugin = site.namespace( 'myplugin/v1' );
    myplugin.authors()
        .id( 7 )
        .then(function( author ) { /* ... */ });
});
```

### Bootstrapping

If you are building an application designed to interface with a specific site, it is possible to sidestep the additional asynchronous HTTP calls that are needed to bootstrap the client through auto-discovery. You can download the root API response, *i.e.* the JSON response when you hit the root endpoint such as `your-site.com/wp-json`, and save that JSON file locally; then, in
your application code, just require in that JSON file and pass the routes property into the `WP` constructor or the `WP.site` method.

Note that you must specify the endpoint URL as normal when using this approach.

```js
var apiRootJSON = require( './my-endpoint-response.json' );
var site = new WP({
    endpoint: 'http://my-site.com/wp-json',
    routes: apiRootJSON.routes
});

// site is now ready to be used with all methods defined in the
// my-endpoint-response.json file, with no need to wait for a Promise.

site.namespace( 'myplugin/v1' ).authors()...
```

To create a slimmed JSON file dedicated to this particular purpose, see the Node script [lib/data/generate-endpoint-request.js](lib/data/generate-endpoint-request.js), which will let you download and save an endpoint response to your local project.

In addition to retrieving the specified resource with `.get()`, you can also `.create()`, `.update()` and `.delete()` resources:

### Creating Posts

To create posts, use the `.create()` method on a query to POST (the HTTP verb for "create") a data object to the server:

```js
// You must authenticate to be able to POST (create) a post
var wp = new WP({
    endpoint: 'http://your-site.com/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'someusername',
    password: 'password'
});
wp.posts().create({
    // "title" and "content" are the only required properties
    title: 'Your Post Title',
    content: 'Your post content',
    // Post will be created as a draft by default if a specific "status"
    // is not specified
    status: 'publish'
}).then(function( response ) {
    // "response" will hold all properties of your newly-created post,
    // including the unique `id` the post was assigned on creation
    console.log( response.id );
})
```

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource on the [WP REST API Documentation Website](http://v2.wp-api.org/reference/).

### Updating Posts

To create posts, use the `.update()` method on a single-item query to PUT (the HTTP verb for "update") a data object to the server:

```js
// You must authenticate to be able to PUT (update) a post
var wp = new WP({
    endpoint: 'http://your-site.com/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'someusername',
    password: 'password'
});
// .id() must be used to specify the post we are updating
wp.posts().id( 2501 ).update({
    // Update the title
    title: 'A Better Title',
    // Set the post live (assuming it was "draft" before)
    status: 'publish'
}).then(function( response ) {
    console.log( response );
})
```

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource on the [WP REST API Documentation Website](http://v2.wp-api.org/reference/).

### Requesting Different Resources

A WP instance object provides the following basic request methods:

* `wp.posts()...`: Request items from the `/posts` endpoints
* `wp.pages()...`: Start a request for the `/pages` endpoints
* `wp.types()...`: Get Post Type collections and objects from the `/types` endpoints
* `wp.comments()...`: Start a request for the `/comments` endpoints
* `wp.taxonomies()...`: Generate a request against the `/taxonomies` endpoints
* `wp.tags()...`: Get or create tags with the `/tags` endpoint
* `wp.categories()...`: Get or create categories with the `/categories` endpoint
* `wp.statuses()...`: Get resources within the `/statuses` endpoints
* `wp.users()...`: Get resources within the `/users` endpoints
* `wp.media()...`: Get Media collections and objects from the `/media` endpoints

All of these methods return a customizable request object. The request object can be further refined with chaining methods, and/or sent to the server via `.get()`, `.create()`, `.update()`, `.delete()`, `.headers()`, or `.then()`. (Not all endpoints support all methods; for example, you cannot POST or PUT records on `/types`, as these are defined in WordPress plugin or theme code.)

Additional querying methods provided, by endpoint:

* **posts**
    - `wp.posts()`: get a collection of posts (default query)
    - `wp.posts().id( n )`: get the post with ID *n*
    - `wp.posts().id( n ).revisions()`: get a collection of revisions for the post with ID *n*
    - `wp.posts().id( n ).revisions( rn )`: get revision *rn* for the post with ID *n*
* **pages**
    - `wp.pages()`: get a collection of page items
    - `wp.pages().id( n )`: get the page with numeric ID *n*
    - `wp.pages().path( 'path/str' )`: get the page with the root-relative URL path `path/str`
    - `wp.pages().id( n ).revisions()`: get a collection of revisions for the page with ID *n*
    - `wp.pages().id( n ).revisions( rn )`: get revision *rn* for the page with ID *n*
* **comments**
    - `wp.comments()`: get a collection of all public comments
    - `wp.comments().id( n )`: get the comment with ID *n*
* **taxonomies**
    - `wp.taxonomies()`: retrieve all registered taxonomies
    - `wp.taxonomies().taxonomy( 'taxonomy_name' )`: get a specific taxonomy object with name *taxonomy_name*
    - `wp.taxonomies().taxonomy( 'taxonomy_name' ).terms()`: get all terms for taxonomy *taxonomy_name*
    - `wp.taxonomies().taxonomy( 'taxonomy_name' ).term( termIdentifier )`: get the term with slug or ID *termIdentifier* from the taxonomy *taxonomy_name*
* **categories**
    - `wp.categories()`: retrieve all registered categories
    - `wp.categories().id( n )`: get a specific category object with id *n*
* **tags**
    - `wp.tags()`: retrieve all registered tags
    - `wp.tags().id( n )`: get a specific tag object with id *n*
* **types**
    - `wp.types()`: get a collection of all registered public post types
    - `wp.types().type( 'cpt_name' )`: get the object for the custom post type with the name *cpt_name*
* **statuses**
    - `wp.statuses()`: get a collection of all registered public post statuses (if the query is authenticated&mdash;will just display "published" if unauthenticated)
    - `wp.statuses().status( 'slug' )`: get the object for the status with the slug *slug*
* **users**
    - `wp.users()`: get a collection of registered users
    - `wp.users().id( n )`: get the user with ID *n* (does not require authentication if that user is a published author within the blog)
    - `wp.users().me()`: get the authenticated user's record
* **media**
    - `wp.media()`: get a collection of media objects (attachments)
    - `wp.media().id( n )`: get media object with ID *n*

For security reasons, methods like `.revisions()` and `.users()` require the request to be authenticated.

### Filtering Collections

Queries against collection endpoints (like `wp.posts()`, which maps to `endpoint/posts/`) can be filtered to specify a subset of posts to return. Many of the WP_Query values are available by default, including `tag`, `author_name`, `page_id`, etc; even more parameters are available to filter byif you authenticate with the API using either [Basic Auth](https://github.com/WP-API/Basic-Auth) or [OAuth](https://github.com/WP-API/OAuth1). You can continue to chain properties until you call `.then`, `.get`, `.post`, `.put`, or `.delete` on the request chain.

Example queries:

```javascript
// All posts belonging to author with nicename "jadenbeirne"
wp.posts().filter( 'author_name', 'jadenbeirne' ).get();

// All posts in category "islands" and tags "clouds" & "sunset"
// (filter can either accept two parameters, as above where it's called with
// a key and a value, or an object of parameter keys and values, as below)
wp.posts().filter({
    category_name: 'islands',
    tag: [ 'clouds', 'sunset' ]
}).get();

// Convenience methods exist for filtering by taxonomy terms
// 'category' can accept either numeric IDs, or string slugs, but not both!
wp.posts().category( 7 ).tag( 'music' ).get();

// Convenience methods also exist for specifying an author: this can also take
// either a numeric ID, or a nicename string. Unlike tags, setting a new value
// will erase any prior value, regardless of type.

// equivalent to .filter( 'author_name', 'williamgibson' ):
wp.posts().author( 'williamgibson' ).get();
// equivalent to .filter( 'author', 42 ):
wp.posts().author( 42 ).get();
// last value wins: this queries for author_name == frankherbert
wp.posts().author( 42 ).author( 'frankherbert' ).get();

// perPage() sets the maximum number of posts to return. 20 latest posts:
wp.posts().perPage( 20 )...
// 21st through 40th latest posts (*i.e.* the second page of results):
wp.posts().perPage( 20 ).page( 2 )...

// Put it all together: Get the 5 most recent posts by jadenbeirne in 'fiction'
wp.posts()
    .author( 'jadenbeirne' )
    .perPage( 5 )
    .tag( 'fiction' )
    .get();
```

**Filtering Shortcut Methods**

The following methods are shortcuts for filtering the requested collection down by various commonly-used criteria:

* `.category( category )`: find posts in a specific category
* `.tag( tag )`: find posts with a specific tag
* `.taxonomy( name, term )`: find items with a specific taxonomy term
* `.search( searchString )`: find posts containing the specified search term(s)
* `.author( author )`: find posts by a specific author, designated either by name or by ID
* `.name( slug )`: find the post with the specified slug
* `.slug( slug )`: alias for `.name()`
* `.year( year )`: find items published in the specified year
* `.month( month )`: find items published in the specified month, designated by the month index (1&ndash;12) or name (*e.g.* "February")
* `.day( day )`: find items published on the specified day

### Uploading Media

Files may be uploaded to the WordPress media library by creating a media record using the `.media()` collection handler.

If you wish to associate a newly-uploaded media record to a specific post, you must use two calls: one to first upload the file, then another to associate it with a post. Example code:

```js
wp.media()
    // Specify a path to the file you want to upload
    .file( '/path/to/the/image.jpg' )
    .create({
        title: 'My awesome image',
        alt_text: 'an image of something awesome',
        caption: 'This is the caption text',
        description: 'More explanatory information'
    })
    .then(function( response ) {
        // Your media is now uploaded: let's associate it with a post
        var newImageId = response.id;
        return wp.media().id( newImageId ).update({
            post: associatedPostId
        });
    })
    .then(function( response ) {
        console.log( 'Media ID #' + response.id );
        console.log( 'is now associated with Post ID #' + response.post );
    });
```

If you are uploading media from the client side, you can pass a reference to a file input's file list entry in place of the file path:

```js
wp.media()
    .file( document.getElementById( 'file-input' ).files[0] )
    .create()...
```

### Custom Routes

Support for Custom Post Types is provided via the `.registerRoute` method. This method returns a handler function which can be assigned to your site instance as a method, and takes the [same namespace and route string arguments as `rest_register_route`](http://v2.wp-api.org/extending/adding/#bare-basics):

```js
var site = new WP({ endpoint: 'http://www.yoursite.com/wp-json' });
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/author/(?P<id>)' );
site.myCustomResource().id( 17 ); // => myplugin/v1/author/17
```

The string `(?P<id>)` indicates that a level of the route for this resource is a dynamic property named ID. By default, properties identified in this fashion will not have any inherent validation. This is designed to give developers the flexibility to pass in anything, with the caveat that only valid IDs will be accepted on the WordPress end.

You might notice that in the example from the official WP-API documentation, a pattern is specified with a different format: this is a [regular expression](http://www.regular-expressions.info/tutorial.html) designed to validate the values that may be used for this capture group.

```js
var site = new WP({ endpoint: 'http://www.yoursite.com/wp-json' });
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)' );
site.myCustomResource().id( 7 ); // => myplugin/v1/author/7
site.myCustomResource().id( 'foo' ); // => Error: Invalid path component: foo does not match (?P<a>\d+)
```
Adding the regular expression pattern (as a string) enabled validation for this component. In this case, the `\\d+` will cause only _numeric_ values to be accepted.

**NOTE THE DOUBLE-SLASHES** in the route definition here, however: `'/author/(?P<id>\\d+)'` This is a JavaScript string, where `\` _must_ be written as `\\` to be parsed properly. A single backslash will break the route's validation.

Each named group in the route will be converted into a named setter method on the route handler, as in `.id()` in the example above: that name is taken from the `<id>` in the route string.

The route string `'pages/(?P<parentPage>[\d]+)/revisions/(?P<id>[\d]+)'` would create the setters `.parentPage()` and `id()`, permitting any permutation of the provided URL to be created.

To permit custom parameter support methods on custom endpoints, a configuration object may be passed to the `registerRoute` method with a `mixins` property defining any functions to add:

```js
site.handler = site.registerRoute( 'myplugin/v1', 'collection/(?P<id>)', {
    mixins: {
        myParam: function( val ) {
            return this.param( 'my_param', val );
        }
    }
});
```
This permits a developer to extend an endpoint with arbitrary parameters in the same manner as is done for the automatically-generated built-in route handlers.

Re-utilizing existing mixins (like `.search()`) on custom routes will be supported in the near future.

#### Setter method naming for named route components

In the example above, registering the route string `'/author/(?P<id>\\d+)'` results in the creation of an `.id()` method on the resulting resource handler:

```js
site.myCustomResource().id( 7 ); // => myplugin/v1/author/7
```

If a named route component (e.g. `(?P<id>\\d+)`, above) is in `snake_case`, then that setter will be converted to camelCase instead, as with `some_part` below:

```js
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/resource/(?P<some_part>\\d+)' );
site.myCustomResource().somePart( 7 ); // => myplugin/v1/resource/7
```

Non-snake_cased route parameter names will be unaffected.