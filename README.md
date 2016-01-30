A WordPress REST API client for JavaScript
==========================================

This is a client for the [WordPress REST API](http://wp-api.org/). It is **under active development**, and should be considered beta software. More features are in progress, and **[issues](https://github.com/kadamwhite/wordpress-rest-api/issues)** are welcome if you find something that doesn't work!

**`wordpress-rest-api` is designed to work with [WP-API](https://github.com/WP-API/WP-API) v2 beta 11 or higher.** If you use a prior version of the beta, some commands will not work.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kadamwhite/wordpress-rest-api?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://api.travis-ci.org/kadamwhite/wordpress-rest-api.png?branch=master)](https://travis-ci.org/kadamwhite/wordpress-rest-api)

**Index**:
[Purpose](#purpose) &bull;
[Installation](#installation) &bull;
[Using The Client](#using-the-client) &bull;
[Authentication](#authentication) &bull;
[API Documentation](#api-documentation) &bull;
[Issues](#issues) &bull;
[Contributing](#contributing)

## Purpose

This library is designed to make it easy for your [Node.js](http://nodejs.org) application to request specific resources from a WordPress install. It uses a query builder-style syntax to let you craft the request being made to the WP-API endpoints, then returns the API server's response to your application as a JavaScript object.

## Installation

To use the library, install it with [npm](http://npmjs.org):
```bash
npm install --save wordpress-rest-api
```
Then, within your application's script files, `require` the module to gain access to it:
```javascript
var WP = require( 'wordpress-rest-api' );
```

The REST API client requires Node.js version 0.10 or above.

## Using The Client

The module is a constructor, so you can create an instance of the API client bound to the endpoint for your WordPress install:
```javascript
var WP = require( 'wordpress-rest-api' );
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

### Creating Posts

To create posts, use the `.post()` method on a query to POST a data object to the server (POST is the HTTP "verb" equivalent for "create"):

```js
// You must authenticate to be able to POST (create) a post
var wp = new WP({
    endpoint: 'http://your-site.com/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'someusername',
    password: 'password'
});
wp.posts().post({
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

### Updating Posts

To create posts, use the `.put()` method on a single-item query to PUT a data object to the server (PUT is the HTTP "verb" equivalent for "update"):

```js
// You must authenticate to be able to PUT (update) a post
var wp = new WP({
    endpoint: 'http://your-site.com/wp-json',
    // This assumes you are using basic auth, as described further below
    username: 'someusername',
    password: 'password'
});
// .id() must be used to specify the post we are updating
wp.posts().id( 2501 ).post({
    // Update the title
    title: 'A Better Title',
    // Set the post live (assuming it was "draft" before)
    status: 'publish'
}).then(function( response ) {
    console.log( response );
})
```

### Requesting Different Resources

A WP instance object provides the following basic request methods:

* `wp.posts()...`: Request items from the `/posts` endpoints
* `wp.taxonomies()...`: Generate a request against the `/taxonomies` endpoints
* `wp.pages()...`: Start a request for the `/pages` endpoints
* `wp.users()...`: Get resources within the `/users` endpoints
* `wp.types()...`: Get Post Type collections and objects from the `/types` endpoints
* `wp.media()...`: Get Media collections and objects from the `/media` endpoints

All of these methods return a customizable request object. The request object can be further refined with chaining methods, and/or sent to the server via `.get()`, `.post()`, `.put()`, `.delete()`, `.head()`, or `.then()`. (Not all endpoints support all methods; for example, you cannot POST or PUT records on `/types`, as these are defined in WordPress plugin or theme code.)

Additional querying methods provided, by endpoint:

* **posts**
    - `wp.posts()`: get a collection of posts (default query)
    - `wp.posts().id( n )`: get the post with ID *n*
    - `wp.posts().id( n ).comments()`: get all comments for post with ID *n*
    - `wp.posts().id( n ).comment( i )`: get a comment with the ID *i* from post with ID *n*
    - `wp.posts().id( n ).revisions()`: get a collection of revisions for the post with ID *n*
    - `wp.posts().type( type_name )`: get posts of custom type *type_name*
    - *There is currently no support for querying post meta values*
* **pages**
    - `wp.pages()`: get a collection of page items
    - `wp.pages().id( n )`: get the page with numeric ID *n*
    - `wp.pages().path( 'path/str' )`: get the page with the root-relative URL path `path/str`
    - `wp.pages().id( n ).comments()`: get all comments for page with ID *n*
    - `wp.pages().id( n ).comment( i )`: get a comment with the ID *i* from page with ID *n*
    - `wp.pages().id( n ).revisions()`: get a collection of revisions for the page with ID *n*
* **taxonomies**
    - `wp.taxonomies()`: retrieve all registered taxonomies
    - `wp.taxonomies().taxonomy( 'taxonomy_name' )`: get a specific taxonomy object with name *taxonomy_name*
    - `wp.taxonomies().taxonomy( 'taxonomy_name' ).terms()`: get all terms for taxonomy *taxonomy_name*
    - `wp.taxonomies().taxonomy( 'taxonomy_name' ).term( termIdentifier )`: get the term with slug or ID *termIdentifier* from the taxonomy *taxonomy_name*
    - **shortcut methods**: These methods enable concisely querying taxonomy endpoint sub-resources
        - `wp.categories()`: shortcut method to retrieve the terms collection for the "category" taxonomy
        - `wp.tags()`: shortcut method to retrieve the terms collection for the "post_tag" taxonomy
        - `wp.taxonomy( 'tax_name' )`: shortcut method to retrieve the taxonomy object corresponding to the provided taxonomy name (equivalent to calling `wp.taxonomies().taxonomy( 'tax_name' )`)
* **types**
    - `wp.types()`: get a collection of all registered public post types
    - `wp.types().type( 'cpt_name' )`: get the object for the custom post type with the name *cpt_name*
* **users**
    - `wp.users()`: get a collection of registered users
    - `wp.users().me()`: get the authenticated user record
    - `wp.users().id( n )`: get the user with ID *n*
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

### Custom Post Types

Support for Custom Post Types has been removed temporarily, but will be reinstated soon once the client supports the new custom post handling changes introduced in the new v2 API betas.

## Embedding data

**Note: This section applies only to the WP-API v2 betas and above**; the initial 1.0 release of the API embedded data by default.

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

WordPress sites can have a lot of content&mdash;far more than you'd want to pull down in a single request. The API endpoints default to providing a limited number of items per request, the same way that a WordPress site will default to 10 posts per page in archive views. The number of objects you can get back can be adjusted by calling the `perPage` method, but many servers will return a 502 error if too much information is requested in one batch.

To work around these restrictions, paginated collection responses are augmented with a `_paging` property. That property contains some useful metadata:

- `total`: The total number of records matching the provided query
- `totalPages`: The number of pages available (`total` / `perPage`)
- `next`: A WPRequest object pre-bound to the next page of results
- `prev`: A WPRequest object pre-bound to the previous page of results
- `links`: an object containing the parsed `link` HTTP header data (when present)

The existence of the `_paging.links.prev` and `_paging.links.next` properties can be used as flags to conditionally show or hide your paging UI, if necessary, as they will only be present when an adjacent page of results is available.

You can use the `next` and `prev` properties to traverse an entire collection, should you so choose. For example, this snippet will recursively request the next page and concatenate it with existing results, in order to build up an array of every post on your site:
```javascript
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

You can also use a `.page(pagenumber)` method on calls that support pagination to directly get that page.

## Authentication

You must be authenticated with WordPress to create, edit or delete resources via the API. Some WP-API endpoints additionally require authentication for GET requsts in cases where the data being requested could be considered private: examples include any of the `/users` endpoints, requests where the `context` query parameter is `true`, and `/revisions` for posts and pages, among others.

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

### Cookie authentication

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
var WP = require( 'wordpress-rest-api' );
var wp = new WP({
    endpoint: window.WP_API_Settings.endpoint,
    nonce: window.WP_API_Settings.nonce
});
```

#### SECURITY WARNING

Please be aware that basic authentication sends your username and password over the wire, in plain text. **We only recommend using basic authentication in production if you are securing your requests with SSL.**

More robust authentication methods will hopefully be added; we would welcome contributions in this area!

## API Documentation

In addition to the above getting-started guide, we have automatically-generated [API documentation](http://kadamwhite.github.io/wordpress-rest-api). More user-oriented documentation, including a more in-depth overview of available endpoint and filter methods, will be added to this README in the near future.


## Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/kadamwhite/wordpress-rest-api/issues). We're excited to see what the community thinks of this project, and we would love your input!

## Contributing

We welcome contributions large and small. See our [contributor guide](CONTRIBUTING.md) for more information.
