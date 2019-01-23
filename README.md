A WordPress REST API client for JavaScript
==========================================

This library is an isomorphic client for the [WordPress REST API](http://developer.wordpress.org/rest-api), designed to work with WordPress 5.0 or later. If you are using the older [WP REST API plugin](https://github.com/WP-API/WP-API) or WordPress 4.9, some commands will not work.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/wp-api/node-wpapi?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/WP-API/node-wpapi.svg?branch=master)](https://travis-ci.org/WP-API/node-wpapi)

**Index**:

- [About](#about)
- [Installation](#installation)
- [Using the Client](#using-the-client)
  - [Auto-Discovery](#auto-discovery)
  - [Creating Posts](#creating-posts)
  - [Updating Posts](#updating-posts)
  - [Requesting Different Resources](#requesting-different-resources)
  - [API Query Parameters & Filtering Collections](#api-query-parameters)
  - [Uploading Media](#uploading-media)
- [Custom Routes](#custom-routes)
  - [Setter Method Naming](#setter-method-naming-for-named-route-components)
  - [Query Parameters & Filtering](#query-parameters--filtering-custom-routes)
  - [Mixins](#mixins)
- [Embedding Data](#embedding-data)
- [Collection Pagination](#collection-pagination)
- [Customizing HTTP Request Behavior](#customizing-http-request-behavior)
  - [Specifying HTTP Headers](#specifying-http-headers)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Issues](#issues)
- [Contributing](#contributing)

## About

`node-wpapi` is an isomorphic JavaScript client for the [WordPress REST API](https://developer.wordpress.org/rest-api) that makes it easy for your JavaScript application to request specific resources from a [WordPress](https://wordpress.org) website. It uses a query builder-style syntax to let you craft the request being made to REST API endpoints, then returns the API's response to your application as a JSON object. And don't let the name fool you: with [Webpack](https://webpack.github.io/) or [Browserify](http://browserify.org/), `node-wpapi` works just as well in the browser as it does on the server!

This library is maintained by K. Adam White at [Bocoup](https://bocoup.com), with contributions from a [great community](https://github.com/WP-API/node-wpapi/graphs/contributors) of WordPress and JavaScript developers.

To get started, `npm install wpapi` or [download the browser build](https://wp-api.github.io/node-wpapi/wpapi.zip) and check out "Installation" and "Using the Client" below.

## Installation

`node-wpapi` works both on the server or in the browser. Node.js version 8 or higher is required, and the latest LTS release is recommended.

In the browser `node-wpapi` officially supports the latest two versions of all evergreen browsers, and Internet Explorer 11.

### Install with NPM

To use the library from Node, install it with [npm](http://npmjs.org):

```bash
npm install --save wpapi
```

Then, within your application's script files, `require` the module to gain access to it:

```javascript
var WPAPI = require( 'wpapi' );
```

This library is designed to work in the browser as well, via a build system such as Browserify or Webpack; just install the package and `require( 'wpapi' )` from your application code.

### Download the UMD Bundle

Alternatively, you may download a [ZIP archive of the bundled library code](https://wp-api.github.io/node-wpapi/wpapi.zip). These files are UMD modules, which may be included directly on a page using a regular `<script>` tag _or_ required via AMD or CommonJS module systems. In the absence of a module system, the UMD modules will export the browser global variable `WPAPI`, which can be used in place of `require( 'wpapi' )` to access the library from your code.

## Using the Client

The module is a constructor, so you can create an instance of the API client bound to the endpoint for your WordPress install:

```javascript
var WPAPI = require( 'wpapi' );
var wp = new WPAPI({ endpoint: 'http://src.wordpress-develop.dev/wp-json' });
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
The `wp` object has endpoint handler methods for every endpoint that ships with the default WordPress REST API plugin.

Once you have used the chaining methods to describe a resource, you may call `.create()`, `.get()`, `.update()` or `.delete()`  to send the API request to create, read, update or delete content within WordPress. These methods are documented in further detail below.

### Self-signed (Insecure) HTTPS Certificates

In a case where you would want to connect to a HTTPS WordPress installation that has a self-signed certificate (insecure), you will need to force a connection by placing the following line before you make any `wp` calls.

```javascript
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
```

### Auto-Discovery

It is also possible to leverage the [capability discovery](https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/) features of the API to automatically detect and add setter methods for your custom routes, or routes added by plugins.

To utilize the auto-discovery functionality, call `WPAPI.discover()` with a URL within a WordPress REST API-enabled site:

```js
var apiPromise = WPAPI.discover( 'http://my-site.com' );
```
If auto-discovery succeeds this method returns a promise that will be resolved with a WPAPI client instance object configured specifically for your site. You can use that promise as the queue that your client instance is ready, then use the client normally within the `.then` callback.

**Custom Routes** will be detected by this process, and registered on the client. To prevent name conflicts, only routes in the `wp/v2` namespace will be bound to your instance object itself. The rest can be accessed through the `.namespace` method on the WPAPI instance, as demonstrated below.

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

#### Authenticating with Auto-Discovery

While using `WPAPI.discover( url )` to generate the handler for your site gets you up and running quickly, it does not provide the same level of customization as instantiating your own `new WPAPI` object. In order to specify authentication configuration when using autodiscovery, chain a `.then` onto the initial discovery query to call the `.auth` method on the returned site object with the relevant credentials (username & password, nonce, etc):

```js
var apiPromise = WPAPI.discover( 'http://my-site.com' ).then(function( site ) {
    return site.auth({
        username: 'admin',
        password: 'always use secure passwords'
    });
});
apiPromise.then(function( site ) {
    // site is now configured to use authentication
})
```

#### Cross-Origin Auto-Discovery

When attempting auto-discovery against a remote server in a client-side environment, discovery will fail unless the server is configured for [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) (CORS). CORS can be enabled by specifying a set of `Access-Control-` headers in your PHP code to instruct browsers that requests from remote clients are accepted; these headers also let you control what specific methods and links are exposed to those remote clients.

The [WP-REST-Allow-All-Cors](https://github.com/ahmadawais/WP-REST-Allow-All-CORS) plugin will permit CORS requests for all API resources. Auto-discovery will still fail when using this plugin, however, because discovery depends on the presence of a `Link` header on WordPress pages outside of the root REST API endpoint.

To permit your site to be auto-discovered by client-side REST API clients, add a filter to `send_headers` to explicitly whitelist the `Link` header for `HEAD` requests:

```php
add_action( 'send_headers', function() {
	if ( ! did_action('rest_api_init') && $_SERVER['REQUEST_METHOD'] == 'HEAD' ) {
		header( 'Access-Control-Allow-Origin: *' );
		header( 'Access-Control-Expose-Headers: Link' );
		header( 'Access-Control-Allow-Methods: HEAD' );
	}
} );
```

Enable CORS at your own discretion. Restricting `Access-Control-Allow-Origin` to a specific origin domain is often preferable to allowing all origins via `*`.

### Bootstrapping

If you are building an application designed to interface with a specific site, it is possible to sidestep the additional asynchronous HTTP calls that are needed to bootstrap the client through auto-discovery. You can download the root API response, *i.e.* the JSON response when you hit the root endpoint such as `your-site.com/wp-json`, and save that JSON file locally; then, in
your application code, just require in that JSON file and pass the routes property into the `WPAPI` constructor or the `WPAPI.site` method.

Note that you must specify the endpoint URL as normal when using this approach.

```js
var apiRootJSON = require( './my-endpoint-response.json' );
var site = new WPAPI({
    endpoint: 'http://my-site.com/wp-json',
    routes: apiRootJSON.routes
});

// site is now ready to be used with all methods defined in the
// my-endpoint-response.json file, with no need to wait for a Promise.

site.namespace( 'myplugin/v1' ).authors()...
```

To create a slimmed JSON file dedicated to this particular purpose, see the npm script [npm run update-default-routes-json](https://github.com/wp-api/node-wpapi/tree/master/build/scripts/update-default-routes-json.js), which will let you download and save an endpoint response to your local project.

In addition to retrieving the specified resource with `.get()`, you can also `.create()`, `.update()` and `.delete()` resources:

### Creating Posts

To create posts, use the `.create()` method on a query to POST (the HTTP verb for "create") a data object to the server:

```js
// You must authenticate to be able to POST (create) a post
var wp = new WPAPI({
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

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource on the [REST API Developer Handbook](https://developer.wordpress.org/rest-api/reference/).

### Updating Posts

To create posts, use the `.update()` method on a single-item query to PUT (the HTTP verb for "update") a data object to the server:

```js
// You must authenticate to be able to PUT (update) a post
var wp = new WPAPI({
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

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource in the [REST API Developer Handbook](https://developer.wordpress.org/rest-api/reference/).

### Requesting Different Resources

A WPAPI instance object provides the following basic request methods:

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
* `wp.settings()...`: Read or update site settings from the `/settings` endpoint (always requires authentication)

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
* **categories**
    - `wp.categories()`: retrieve all registered categories
    - `wp.categories().id( n )`: get a specific category object with id *n*
* **tags**
    - `wp.tags()`: retrieve all registered tags
    - `wp.tags().id( n )`: get a specific tag object with id *n*
* **custom taxonomy terms**
    - [Use `registerRoute()`](http://wp-api.org/node-wpapi/custom-routes/) or [route auto-discovery](http://wp-api.org/node-wpapi/using-the-client/#auto-discovery) to query for custom taxonomy terms
* **types**
    - `wp.types()`: get a collection of all registered public post types
    - `wp.types().type( 'cpt_name' )`: get the object for the custom post type with the name *cpt_name*
* **statuses**
    - `wp.statuses()`: get a collection of all registered public post statuses (if the query is authenticated&mdash;will just display "published" if unauthenticated)
    - `wp.statuses().status( 'slug' )`: get the object for the status with the slug *slug*
* **users**
    - `wp.users()`: get a collection of users (will show only users with published content if request is not authenticated)
    - `wp.users().id( n )`: get the user with ID *n* (does not require authentication if that user is a published author within the blog)
    - `wp.users().me()`: get the authenticated user's record
* **media**
    - `wp.media()`: get a collection of media objects (attachments)
    - `wp.media().id( n )`: get media object with ID *n*
* **settings**
    - `wp.settings()`: get or update one or many site settings

For security reasons, methods like `.revisions()` and `.settings()` require the request to be authenticated, and others such as `.users()` and `.posts()` will return only a subset of their information without authentication.

#### toString()

To get the URI of the resource _without_ making a request, call `.toString()` at the end of a query chain:

```js
var uriString = wp.posts().id( 7 ).embed().toString();
```

As the name implies `.toString()` is not a chaining method, and will return a string containing the full URI; this can then be used with alternative HTTP transports like `request`, Node's native `http`, `fetch`, or jQuery.

### API Query Parameters

To set a query parameter on a request, use the `.param()` method:

```js
// All posts by author w/ ID "7" published before Sept 22, 2016
wp.posts()
  .param( 'before', new Date( '2016-09-22' ) )
  .param( 'author', 7 )...
```

You can continue to chain properties until you call `.then`, `.get`, `.create`, `.update`, or `.delete` on the request chain.

**Parameter Shortcut Methods**

This library provides convenience methods for many of the most common parameters, like `search=` (search for a string in post title or content), `slug` (query for a post by slug), and `before` and `after` (find posts in a given date range):

```js
// Find a page with a specific slug
wp.pages().slug( 'about' )...

// Find a post authored by the user with ID #42
wp.posts().author( 42 )...

// Find trashed posts
wp.posts().status( 'trash' )...

// Find posts in status "future" or "draft"
wp.posts().status([ 'draft', 'future' ])...

// Find all categories containing the word "news"
wp.categories().search( 'news' )...

// Find posts from March 2013 (provide a Date object or full ISO-8601 date):
wp.posts().before( '2013-04-01T00:00:00.000Z' ).after( new Date( 'March 01, 2013' ) )...

// Return ONLY sticky posts
wp.posts().sticky( true )...

// Return NO sticky posts
wp.posts().sticky( false )...

// Supply the password for a password-protected post
wp.posts().id( 2501 ).password( 'correct horse battery staple' )...
```

#### Paging & Sorting

Convenience methods are also available to set paging & sorting properties like `page`, `per_page` (available as `.perPage()`), `offset`, `order` and `orderby`:

```js
// perPage() sets the maximum number of posts to return. 20 latest posts:
wp.posts().perPage( 20 )...
// 21st through 40th latest posts (*i.e.* the second page of results):
wp.posts().perPage( 20 ).page( 2 )...
// Order posts alphabetically by title:
wp.posts().order( 'asc' ).orderby( 'title' )...
```

See the section on collection pagination for more information.

#### Filtering by Taxonomy Terms

A variety of other methods are available to further modify which posts are returned from the API. For example, to restrict the returned posts to only those in category 7, pass that ID to the `.categories()` method:

```js
wp.posts().categories( 7 )...
```

**Relationships in the REST API are always specified by ID.** The slug of a term may change, but the term ID associated with the underlying post will not.

To find the ID of a tag or category for which the slug is known, you can query the associated collection with `.slug()` and use the ID of the returned object in a two-step process:

```js
wp.categories().slug( 'fiction' )
    .then(function( cats ) {
        // .slug() queries will always return as an array
        var fictionCat = cats[0];
        return wp.posts().categories( fictionCat.id );
    })
    .then(function( postsInFiction ) {
        // These posts are all categorized "fiction":
        console.log( postsInFiction );
    });
```

To find posts in category 'fiction' and tagged either 'magical-realism' or 'historical', this process can be extended: note that this example uses the [`RSVP.hash` utility](https://github.com/tildeio/rsvp.js/#hash-of-promises) for convenience and parallelism, but the same result could easily be accomplished with `Promise.all` or by chaining each request.

```js
RSVP.hash({
  categories: wp.categories().slug( 'fiction' ),
  tags1: wp.tags().slug('magical-realism'),
  tags2: wp.tags().slug('historical')
}).then(function( results ) {
    // Combine & map .slug() results into arrays of IDs by taxonomy
    var tagIDs = results.tags1.concat( results.tags2 )
        .map(function( tag ) { return tag.id; });
    var categoryIDs = results.categories
        .map(function( cat ) { return cat.id; });
    return wp.posts()
        .tags( tags )
        .categories( categories );
}).then(function( posts ) {
    // These posts are all fiction, either magical realism or historical:
    console.log( posts );
});
```

This process may seem cumbersome, but it provides a more broadly reliable method of querying than querying by mutable slugs. The first requests may also be avoided entirely by pre-creating and storing a dictionary of term slugs and their associated IDs in your application; however, be aware that this dictionary must be updated whenever slugs change.

It is also possible to add your own slug-oriented query parameters to a site that you control by creating a plugin that registers additional collection parameter arguments.

**Excluding terms**

Just as `.categories()` and `.tags()` can be used to return posts that are associated with one or more taxonomies, two methods exist to exclude posts by their term associations.

- `.excludeCategories()` is a shortcut for `.param( 'categories_exclude', ... )` which excludes results associated with the provided category term IDs
- `.excludeTags()` is a shortcut for `.param( 'tags_exclude', ... )` which excludes results associated with the provided tag term IDs

**Custom Taxonomies**

Just as the `?categories` and `?categories_exclude` parameters are available for use with the built-in taxonomies, any custom taxonomy that is registered with a `rest_base` argument has a `?{taxonomy rest_base}` and `?{taxonomy rest_base}_exclude` parameter available, which can be set directly using `.param`. For the custom taxonomy `genres`, for example:

- `wp.posts().param( 'genres', [ array of genre term IDs ])`: return only records associated with any of the provided genres
- `wp.posts().param( 'genres_exclude', [ array of genre term IDs ])`: return only records associated with none of the provided genres

#### Retrieving posts by author

The `.author()` method also exists to query for posts authored by a specific user (specified by ID).

```js
// equivalent to .param( 'author', 42 ):
wp.posts().author( 42 ).get();

// last value wins: this queries for author == 71
wp.posts().author( 42 ).author( 71 ).get();
```

As with categories and tags, the `/users` endpoint may be queried by slug to retrieve the ID to use in this query, if needed.

### Password-Protected posts

The `.password()` method (not to be confused with the password property of `.auth()`!) sets the password to use to view a password-protected post. Any post for which the content is protected will have `protected: true` set on its `content` and `excerpt` properties; `content.rendered` and `excerpt.rendered` will both be `''` until the password is provided by query string.

```js
wp.posts().id( idOfProtectedPost )
    .then(function( result ) {
        console.log( result.content.protected ); // true
        console.log( result.content.rendered ); // ""
    });

wp.posts.id( idOfProtectedPost )
    // Provide the password string with the request
    .password( 'thepasswordstring' )
    .then(function( result ) {
        console.log( result.content.rendered ); // "The post content"
    });
```

#### Other Filters

The `?filter` query parameter is not natively supported within the WordPress core REST API endpoints, but can be added to your site using the [rest-filter plugin](https://github.com/wp-api/rest-filter). `filter` is a special query parameter that lets you directly specify many WP_Query arguments, including `tag`, `author_name`, and other [public query vars](https://codex.wordpress.org/WordPress_Query_Vars). Even more parameters are available for use with `filter` once you [authenticate with the API](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/).

If your environment supports this parameter, other filtering methods will be available if you initialize your site [using auto-discovery](http://wp-api.org/node-wpapi/using-the-client/#auto-discovery), which will auto-detect the availability of `filter`:

```js
WPAPI.discover( 'http://mysite.com' )
    .then(function( site ) {
        // Apply an arbitrary `filter` query parameter:
        // All posts belonging to author with nicename "jadenbeirne"
        wp.posts().filter( 'author_name', 'jadenbeirne' ).get();

        // Query by the slug of a category or tag
        // Get all posts in category "islands" and tags "clouds" & "sunset"
        // (filter can either accept two parameters, as above where it's called with
        // a key and a value, or an object of parameter keys and values, as below)
        wp.posts().filter({
            category_name: 'islands',
            tag: [ 'clouds', 'sunset' ]
        })...

        // Query for a page at a specific URL path
        wp.pages().filter( 'pagename', 'some/url/path' )..
    });
```

**Date Filter Methods**

`?before` and `?after` provide first-party support for querying by date, but should you have access to `filter` then three additional date query methods are available to return posts from a specific month, day or year:

* `.year( year )`: find items published in the specified year
* `.month( month )`: find items published in the specified month, designated by the month index (1&ndash;12) or name (*e.g.* "February")
* `.day( day )`: find items published on the specified day

### Uploading Media

Files may be uploaded to the WordPress media library by creating a media record using the `.media()` collection handler.

The file to upload can be specified as

- a `String` describing an image file path, _e.g._ `'/path/to/the/image.jpg'`
- a `Buffer` with file content, _e.g._ `new Buffer()`
- a file object from a `<input>` element, _e.g._ `document.getElementById( 'file-input' ).files[0]`

The file is passed into the `.file()` method:

```js
wp.media().file(content [, name])...
```

The optional second string argument specifies the file name to use for the uploaded media. If the name argument is omitted `file()` will try to infer a filename from the provided content.

#### Adding Media to a Post

If you wish to associate a newly-uploaded media record to a specific post, you must use two calls: one to first upload the file, then another to associate it with a post. Example code:

```js
wp.media()
    // Specify a path to the file you want to upload, or a Buffer
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

## Custom Routes

Support for Custom Post Types is provided via the `.registerRoute` method. This method returns a handler function which can be assigned to your site instance as a method, and takes the [same namespace and route string arguments as `rest_register_route`](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/):

```js
var site = new WPAPI({ endpoint: 'http://www.yoursite.com/wp-json' });
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/author/(?P<id>)' );
site.myCustomResource().id( 17 ); // => myplugin/v1/author/17
```

The string `(?P<id>)` indicates that a level of the route for this resource is a dynamic property named ID. By default, properties identified in this fashion will not have any inherent validation. This is designed to give developers the flexibility to pass in anything, with the caveat that only valid IDs will be accepted on the WordPress end.

You might notice that in the example from the official WP-API documentation, a pattern is specified with a different format: this is a [regular expression](http://www.regular-expressions.info/tutorial.html) designed to validate the values that may be used for this capture group.

```js
var site = new WPAPI({ endpoint: 'http://www.yoursite.com/wp-json' });
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)' );
site.myCustomResource().id( 7 ); // => myplugin/v1/author/7
site.myCustomResource().id( 'foo' ); // => Error: Invalid path component: foo does not match (?P<a>\d+)
```
Adding the regular expression pattern (as a string) enabled validation for this component. In this case, the `\\d+` will cause only _numeric_ values to be accepted.

**NOTE THE DOUBLE-SLASHES** in the route definition here, however:

```
'/author/(?P<id>\\d+)'
```

This is a JavaScript string, where `\` _must_ be written as `\\` to be parsed properly. A single backslash will break the route's validation.

Each named group in the route will be converted into a named setter method on the route handler, as in `.id()` in the example above: that name is taken from the `<id>` in the route string.

The route string `'pages/(?P<parentPage>[\\d]+)/revisions/(?P<id>[\\d]+)'` would create the setters `.parentPage()` and `id()`, permitting any permutation of the provided URL to be created.

### Setter method naming for named route components

In the example above, registering the route string `'/author/(?P<id>\\d+)'` results in the creation of an `.id()` method on the resulting resource handler:

```js
site.myCustomResource().id( 7 ); // => myplugin/v1/author/7
```

If a named route component (_e.g._ the "id" part in `(?P<id>\\d+)`, above) is in `snake_case`, then that setter will be converted to camelCase instead, as with `some_part` below:

```js
site.myCustomResource = site.registerRoute( 'myplugin/v1', '/resource/(?P<some_part>\\d+)' );
site.myCustomResource().somePart( 7 ); // => myplugin/v1/resource/7
```

Non-snake_cased route parameter names will be unaffected.

### Query Parameters & Filtering Custom Routes

Many of the filtering methods available on the built-in collections are built in to custom-registered handlers, including `.page()`, `.perPage()`, `.search()`, `.include()`/`.exclude()` and `.slug()`; these parameters are supported across nearly all API endpoints, so they are made available automatically to custom endpoints as well.

However not _every_ filtering method is available by default, so for convenience a configuration object may be passed to the `registerRoute` method with a `params` property specifying additional query parameters to support. This makes it very easy to add existing methods like `.before()` or `.after()` to your own endpoints:

```js
site.handler = site.registerRoute( 'myplugin/v1', 'collection/(?P<id>)', {
    // Listing any of these parameters will assign the built-in
    // chaining method that handles the parameter:
    params: [ 'before', 'after', 'author', 'parent', 'post' ]
});
// yields
site.handler().post( 8 ).author( 92 ).before( dateObj )...
```

If you wish to set custom parameters, for example to query by the custom taxonomy `genre`, you can use the `.param()` method as usual:

```js
site.handler().param( 'genre', genreTermId );
```

but you can also specify additional query parameter names and a `.param()` wrapper function will be added automatically. _e.g._ here `.genre( x )` will be created as a shortcut for `.param( 'genre', x )`:

```js
site.books = site.registerRoute( 'myplugin/v1', 'books/(?P<id>)', {
    params: [ 'genre' ]
});
// yields
site.books().genre([ genreId1, genreId2 ])...
```

### Mixins

To assign completely arbitrary custom methods for use with your custom endpoints, a configuration object may be passed to the `registerRoute` method with a `mixins` property defining any functions to add:

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

Note that mixins should always return `this` to support method chaining.

## Embedding Data

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
        "wp:attachment": [ /* ... */ ],
        "wp:term": [
            [ {}, {} /* category terms */ ],
            [ {} /* tag terms */ ],
            /* etc... */
        ],
        "wp:meta": [ /* ... */ ]
    }
}
```

For more on working with embedded data, [check out the WP-API documentation](https://developer.wordpress.org/rest-api/using-the-rest-api/linking-and-embedding/).

## Collection Pagination

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
function getAll( request ) {
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

### Using `offset`

If you prefer to think about your collections in terms of _offset_, or how many items "into" the collection you want to query, you can use the `offset` parameter (and parameter convenience method) instead of `page`. These are equivalent:

```js
// With .page()
wp.posts().perPage( 5 ).page( 3 )...
// With .offset()
wp.posts().perPage( 5 ).offset( 10 )...
```

## Customizing HTTP Request Behavior

By default `node-wpapi` uses the [superagent](https://www.npmjs.com/package/superagent) library internally to make HTTP requests against the API endpoints. Superagent is a flexible tool that works on both the client and the browser, but you may want to use a different HTTP library, or to get data from a cache when available instead of making an HTTP request. To facilitate this, `node-wpapi` lets you supply a `transport` object when instantiating a site client to specify custom functions to use for one (or all) of GET, POST, PUT, DELETE & HEAD requests.

**This is advanced behavior; you will only need to utilize this functionality if your application has very specific HTTP handling or caching requirements.**

In order to maintain consistency with the rest of the API, custom transport methods should take in a WordPress API route handler query object (_e.g._ the result of calling `wp.posts()...` or any of the other chaining resource handlers), a `data` object (for POST, PUT and DELETE requests), and an optional callback function (as `node-wpapi` transport methods both return Promise objects _and_ support traditional `function( err, response )` callbacks).

The default HTTP transport methods are available as `WPAPI.transport` (a property of the constructor object) and may be called within your transports if you wish to extend the existing behavior, as in the example below.

**Example:** Cache requests in a simple dictionary object, keyed by request URI. If a request's response is already available, serve from the cache; if not, use the default GET transport method to retrieve the data, save it in the cache, and return it to the consumer:

```js
var site = new WPAPI({
  endpoint: 'http://my-site.com/wp-json',
  transport: {
    // Only override the transport for the GET method, in this example
    // Transport methods should take a wpreq object and a callback:
    get: function( wpreq, cb ) {
      var result = cache[ wpreq ];
      // If a cache hit is found, return it via the same callback/promise
      // signature as the default transport method:
      if ( result ) {
        if ( cb && typeof cb === 'function' ) {
          // Invoke the callback function, if one was provided
          cb( null, result );
        }
        // Return the data as a promise
        return Promise.resolve( result );
      }

      // Delegate to default transport if no cached data was found
      return WPAPI.transport.get( wpreq, cb ).then(function( result ) {
        cache[ wpreq ] = result;
        return result;
      });
    }
  }
});
```

You may set one or many custom HTTP transport methods on an existing WP site client instance (for example one returned through [auto-discovery](#auto-discovery) by calling the `.transport()` method on the site client instance and passing an object of handler functions:

```js
site.transport({
    get: function( wpreq, callbackFn ) { /* ... */},
    put: function( wpreq, callbackFn ) { /* ... */}
});
```

Note that these transport methods are the internal methods used by `create` and `.update`, so the names of these methods therefore map to the HTTP verbs "get", "post", "put", "head" and "delete"; name your transport methods accordingly or they will not be used.
### Specifying HTTP Headers

If you need to send additional HTTP headers along with your request (for example to provide a specific `Authorization` header for use with alternative authentication schemes), you can use the `.setHeaders()` method to specify one or more headers to send with the dispatched request:

#### Set headers for a single request

```js
// Specify a single header to send with the outgoing request
wp.posts().setHeaders( 'Authorization', 'Bearer xxxxx.yyyyy.zzzzz' )...

// Specify multiple headers to send with the outgoing request
wp.posts().setHeaders({
    Authorization: 'Bearer xxxxx.yyyyy.zzzzz',
    'Accept-Language': 'pt-BR'
})...
```

#### Set headers globally

You can also set headers globally on the WPAPI instance itself, which will then be used for all subsequent requests created from that site instance:

```js
// Specify a header to be used by all subsequent requests
wp.setHeaders( 'Authorization', 'Bearer xxxxx.yyyyy.zzzzz' );

// These will now be sent with an Authorization header
wp.users().me()...
wp.posts().id( unpublishedPostId )...
```

## Authentication

You must be authenticated with WordPress to create, edit or delete resources via the API. Some WP-API endpoints additionally require authentication for GET requests in cases where the data being requested could be considered private: examples include any of the `/users` endpoints, requests where the `context` query parameter is `true`, and `/revisions` for posts and pages, among others.

### Basic Authentication

This library currently supports [basic HTTP authentication](http://en.wikipedia.org/wiki/Basic_access_authentication). To authenticate with your WordPress install,

1. Download and install the [Basic Authentication handler plugin](https://github.com/WP-API/Basic-Auth) on your target WordPress site. *(Note that the basic auth handler is not curently available through the plugin repository: you must install it manually.)*
2. Activate the plugin.
3. Specify the username and password of an authorized user (a user that can edit_posts) when instantiating the WPAPI request object:

```javascript
var wp = new WPAPI({
    endpoint: 'http://www.website.com/wp-json',
    username: 'someusername',
    password: 'thepasswordforthatuser'
});
```

Now any requests generated from this WPAPI instance will use that username and password for basic authentication if the targeted endpoint requires it.

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
wp.posts().id( 817 ).auth( {username: 'mcurie', password: 'nobel'} ).get(...
```
This will override any previously-set username or password values.

**Authenticate all requests for a WPAPI instance**

It is possible to make all requests from a WPAPI instance use authentication by setting the `auth` option to `true` on instantiation:

```javascript
var wp = new WPAPI({
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

When the library is loaded from the frontend of the WordPress site you are querying against, you may authenticate your REST API requests using the built in WordPress [Cookie authentication](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#cookie-authentication) by creating and passing a Nonce with your API requests.

First localize your scripts with an object with root-url and nonce in your theme's `functions.php` or your plugin:

```php
function my_enqueue_scripts() {
    wp_enqueue_script( 'app', get_template_directory_uri() . '/assets/dist/bundle.js', array(), false, true );
    wp_localize_script( 'app', 'WP_API_Settings', array(
        'endpoint' => esc_url_raw( rest_url() ),
        'nonce' => wp_create_nonce( 'wp_rest' )
    ) );
}
add_action( 'wp_enqueue_scripts', 'my_enqueue_scripts' );
```

And then use this nonce when initializing the library:

```javascript
var WPAPI = require( 'wpapi' );
var wp = new WPAPI({
    endpoint: window.WP_API_Settings.endpoint,
    nonce: window.WP_API_Settings.nonce
});
```

## API Documentation

In addition to the above getting-started guide, we have automatically-generated [API documentation](http://wp-api.org/node-wpapi/api-reference/wpapi/1.1.2/).


## Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/wp-api/node-wpapi/issues). We're excited to see what the community thinks of this project, and we would love your input!

## Contributing

We welcome contributions large and small. See our [contributor guide](CONTRIBUTING.md) for more information.
