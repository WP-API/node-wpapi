A WordPress REST API client for JavaScript
==========================================

This is a client for the [WordPress REST API](http://v2.wp-api.org/). It is **under active development**, and should be considered beta software. More features are in progress, and **[issues](https://github.com/wp-api/node-wpapi/issues)** are welcome if you find something that doesn't work!

**`wpapi` is designed to work with [WP-API](https://github.com/WP-API/WP-API) v2 beta 1 or higher.** If you use a prior version of the beta, some commands will not work. The latest beta is always recommended!

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/wp-api/node-wpapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/WP-API/node-wpapi.svg?branch=master)](https://travis-ci.org/WP-API/node-wpapi)

**Index**:

- [About](#about)
- [Installation](#installation)
- [Using the Client](#using-the-client)
  - [Auto-discovery](#auto-discovery)
  - [Creating Posts](#creating-posts)
  - [Updating Posts](#updating-posts)
  - [Requesting Different Resources](#requesting-different-resources)
  - [Filtering Collections](#filtering-collections)
  - [Uploading Media](#uploading-media)
  - [Custom Routes](#custom-routes)
- [Embedding Data](#embedding-data)
- [Paginated Collections](#working-with-paged-response-data)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Issues](#issues)
- [Contributing](#contributing)

## About

`node-wpapi` makes it easy for your JavaScript application to request specific resources from a [WordPress](https://wordpress.org) website. It uses a query builder-style syntax to let you craft the request being made to [WordPress REST API](http://v2.wp-api.org) endpoints, then returns the API's response to your application as a JavaScript object. And don't let the name fool you: `node-wpapi` works just as well in the browser as it does on the server!

This library is maintained by K. Adam White at [Bocoup](https://bocoup.com), with contributions from a [great community](https://github.com/WP-API/node-wpapi/graphs/contributors) of WordPress and JavaScript developers.

To get started, `npm install wpapi` or [download the browser build](https://wp-api.github.io/node-wpapi/wpapi.zip) and check out "Installation" and "Using the Client" below.

## Installation

`node-wpapi` works both on the server or in the browser.

### Install with NPM

To use the library from Node, install it with [npm](http://npmjs.org):

```bash
npm install --save wpapi
```

Then, within your application's script files, `require` the module to gain access to it:

```javascript
var WP = require( 'wpapi' );
```

This library requires Node.js version 0.12 or above; 4.0 or higher is highly recommended.

This library is designed to work in the browser as well, via a build system such as Browserify or Webpack; just install the package and `require( 'wpapi' )` from your application code.

### Download the UMD Bundle

Alternatively, you may download a [ZIP archive of the bundled library code](https://wp-api.github.io/node-wpapi/wpapi.zip). These files are UMD modules, which may be included directly on a page using a regular `<script>` tag _or_ required via AMD or CommonJS module systems. In the absence of a module system, the UMD modules will export the browser global variable `WPAPI`, which can be used in place of `require( 'wpapi' )` to access the library from your code.

## Using the Client

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

## Embedding Data

_**Note:** This section applies only to the WP-API v2 betas and above; the initial 1.0 release of the API embedded data by default._

Data types in WordPress are interrelated: A post has an author, some number of tags, some number of categories, *etc*. By default, the API responses will provide pointers to these related objects, but will not embed the full resources: so, for example, the `"author"` property would come back as just the author's ID, *e.g.* `"author": 4`.

This functionality provides API consumers the flexibility to determine when and how they retrieve the related data. However, there are also times where an API consumer will want to get the most data in the fewest number of responses. Certain resources (author, comments, tags, and categories, to name a few) support *embedding*, meaning that they can be included in the response if the `_embed` query parameter is set.

To request that the API respond with embedded data, simply call `.embed()` as part of the request chain:

`wp.posts().id( 2501 ).embed()`...

This will include an `._embedded` object in the response JSON, which contains all of those embeddable objects:

```js
{
    "_embedded": {
        "author": [ /* ... */ ],
        "replies": [ /* ... */ ],
        "http://v2.wp-api.org/attachment": [ /* ... */ ],
        "http://v2.wp-api.org/term": [
            [ {}, {} /* category terms */ ],
            [ {} /* tag terms */ ],
            /* etc... */
        ],
        "http://v2.wp-api.org/meta": [ /* ... */ ]
    }
}
```

For more on working with embedded data, [check out the WP-API documentation](http://v2.wp-api.org/).

## Working with Paged Response Data

WordPress sites can have a lot of content&mdash;far more than you'd want to pull down in a single request. The API endpoints default to providing a limited number of items per request, the same way that a WordPress site will default to 10 posts per page in archive views. The number of objects you can get back can be adjusted by calling the `perPage` method, but `perPage` is capped at 100 items per request for performance reasons. To work around these restrictions, the API provides headers so the API will frequently have to return your posts  be unable to fit all of your posts in a single query.

### Using Pagination Headers

Paginated collection responses are augmented with a `_paging` property derived from the collection's pagination headers. That `_paging` property on the response object contains some useful metadata:

- `.total`: The total number of records matching the provided query
- `.totalPages`: The number of pages available (`total` / `perPage`)
- `.next`: A WPRequest object pre-bound to the next page of results
- `.prev`: A WPRequest object pre-bound to the previous page of results
- `.links`: an object containing the parsed `link` HTTP header data (when present)

The existence of the `_paging.links.prev` and `_paging.links.next` properties can be used as flags to conditionally show or hide your paging UI, if necessary, as they will only be present when an adjacent page of results is available.

You can use the `next` and `prev` properties to traverse an entire collection, should you so choose. For example, this snippet will recursively request the next page of posts and concatenate it with existing results, in order to build up an array of every post on your site:

```javascript
var _ = require( 'lodash' );
getAll( request ) {
  return request.then(function( response ) {
    if ( ! response._paging || ! response._paging.next ) {
      return response;
    }
    // Request the next page and return both responses as one collection
    return Promise.all([
      response,
      getAll( response._paging.next )
    ]).then(function( responses ) {
      return _.flatten( responses );
    });
  });
}
// Kick off the request
getAll( wp.posts() ).then(function( allPosts ) { /* ... */ });
```

Be aware that this sort of unbounded recursion can take a **very long time**: if you use this technique in your application, we strongly recommend caching the response objects in a local database rather than re-requesting from the WP remote every time you need them.

Depending on the amount of content in your site loading all posts into memory may also exceed Node's available memory, causing an exception. If this occurs, try to work with smaller subsets of your data at a time.

### Requesting a Specific Page

You can also use a `.page(pagenumber)` method on calls that support pagination to directly get that page. For example, to set the API to return 5 posts on every page of results, and to get the third page of results (posts 11 through 15), you would write

```js
wp.posts().perPage( 5 ).page( 3 ).then(/* ... */);
```

## Authentication

You must be authenticated with WordPress to create, edit or delete resources via the API. Some WP-API endpoints additionally require authentication for GET requests in cases where the data being requested could be considered private: examples include any of the `/users` endpoints, requests where the `context` query parameter is `true`, and `/revisions` for posts and pages, among others.

### Basic Authentication

This library currently supports [basic HTTP authentication](http://en.wikipedia.org/wiki/Basic_access_authentication). To authenticate with your WordPress install,

1. Download and install the [Basic Authentication handler plugin](https://github.com/WP-API/Basic-Auth) on your target WordPress site. *(Note that the basic auth handler is not curently available through the plugin repository: you must install it manually.)*
2. Activate the plugin.
3. Specify the username and password of an authorized user (a user that can edit_posts) when instantiating the WP request object:

```javascript
var wp = new WP({
    endpoint: 'http://www.website.com/wp-json',
    username: 'someusername',
    password: 'thepasswordforthatuser'
});
```

Now any requests generated from this WP instance will use that username and password for basic authentication if the targeted endpoint requires it.

As an example, `wp.users().me()` will automatically enable authentication to permit access to the `/users/me` endpoint. (If a username and password had not been provided, a 401 error would have been returned.)

### Manually forcing authentication

Because authentication may not always be set when needed, an `.auth()` method is provided which can enable authentication for any request chain:

```javascript
// This will authenticate the GET to /posts/id/817
wp.posts().id( 817 ).auth().get(...
```
This `.auth` method can also be used to manually specify a username and a password as part of a request chain:

```javascript
// Use username "mcurie" and password "nobel" for this request
wp.posts().id( 817 ).auth( 'mcurie', 'nobel' ).get(...
```
This will override any previously-set username or password values.

**Authenticate all requests for a WP instance**

It is possible to make all requests from a WP instance use authentication by setting the `auth` option to `true` on instantiation:

```javascript
var wp = new WP({
    endpoint: // ...
    username: // ...
    password: // ...
    auth: true
});
```

#### SECURITY WARNING

Please be aware that basic authentication sends your username and password over the wire, in plain text. **We only recommend using basic authentication in production if you are securing your requests with SSL.**

More robust authentication methods will hopefully be added; we would welcome contributions in this area!

### Cookie Authentication

When the library is loaded from the frontend of the WP-site you are querying against, you can utilize the build in [Cookie authentication](http://wp-api.org/guides/authentication.html) supported by WP REST API.

First localize your scripts with an object with root-url and nonce in your theme's `functions.php` or your plugin::

```php
function my_enqueue_scripts() {
    wp_enqueue_script( 'app', get_template_directory_uri() . '/assets/dist/bundle.js', array(), false, true );
    wp_localize_script( 'app', 'WP_API_Settings', array(
        'endpoint' => esc_url_raw( get_json_url() ),
        'nonce' => wp_create_nonce( 'wp_json' ) )
    );
}
add_action( 'wp_enqueue_scripts', 'my_enqueue_scripts' );
```

And then use this nonce when initializing the library:

```javascript
var WP = require( 'wpapi' );
var wp = new WP({
    endpoint: window.WP_API_Settings.endpoint,
    nonce: window.WP_API_Settings.nonce
});
```

## API Documentation

In addition to the above getting-started guide, we have automatically-generated [API documentation](http://wp-api.github.io/node-wpapi).


## Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/wp-api/node-wpapi/issues). We're excited to see what the community thinks of this project, and we would love your input!

## Contributing

We welcome contributions large and small. See our [contributor guide](CONTRIBUTING.md) for more information.
