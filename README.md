A WordPress REST API client for Node.js
=======================================

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/kadamwhite/wordpress-rest-api?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a client for the [WordPress REST API](http://wp-api.org/). It is **under active development**, and should be considered beta software. More features will be coming over the course of the summer; meanwhile, **[issues](https://github.com/kadamwhite/wordpress-rest-api/issues)** are welcome if you find something that doesn't work!

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
var wp = new WP({ endpoint: 'http://src.wordpress-develop.dev' });
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

### Requesting Different Resources

A WP instance object provides the following basic request methods:

* `wp.posts()...`: Request items from the `/posts` endpoints
* `wp.taxonomies()...`: Generate a request against the `/taxonomies` endpoints
* `wp.pages()...`: Start a request for the `/pages` endpoints
* `wp.users()...`: Get resources within the `/users` endpoints
* `wp.types()...`: Get Post Type collections and objects from the `/posts/types` endpoints
* `wp.media()...`: Get Media collections and objects from the `/media` endpoints

All of these methods return a customizable request object. The request object can be further refined with chaining methods, and/or sent to the server via `.get()`, `.post()`, `.put()`, `.delete()`, `.head()`, or `.then()`. (Not all endpoints support all methods; for example, you cannot POST or PUT records on `/posts/types`, as these are defined in WordPress plugin or theme code.)

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

// Put it all together: Get the 5 most recent posts by jadenbeirne in 'fiction'
wp.posts()
    .author( 'jadenbeirne' )
    .filter( 'posts_per_page', 5 )
    .tag( 'fiction' )
    .get();

// posts_per_page is exposed to set the maximum number of posts to return
// 20 latest posts:
wp.posts().filter( 'posts_per_page', 20 )...
// 21st through 40th latest posts (*i.e.* the second page of results):
wp.posts().filter( 'posts_per_page', 20 ).page( 2 )...
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

### Custom Post Types

In addition to the filters described above, the `posts()` request method provides a chaining method `type()` which can be used to target your query at one or more custom post types:
```javascript
// Find items for a specific CPT
wp.posts().type( 'your_cpt' )...

// Retrieve both your own CPT, and the native "post" type
wp.posts().type([ 'your_cpt', 'post' ])...
```
If you are building an application that relies very heavily on custom types, you may find yourself wanting a convenience method for requesting your own custom type. The method `registerType` can be used to define a convenience method of that sort:
```javascript
// Defines a CPT handler `events()` on the current WP instance
wp.events = wp.registerType( 'event_cpt' );
```
`wp.events()`` can now be used to specify requests for that custom post type quickly:
```javascript
wp.events().then(function( eventItems ) {
  // Do something with the returned collection of event objects
});
```

## Working with Paged Response Data

WordPress sites can have a lot of content&mdash;far more than you'd want to pull down in a single request. The API endpoints default to providing a limited number of items per request, the same way that a WordPress site will default to 10 posts per page in archive views. The number of objects you can get back can be adjusted by passing a `posts_per_page` filter, but many servers will return a 502 error if too much information is requested in one batch.

To work around these restrictions, paginated collection responses are augmented with a `_paging` property. That property contains some useful metadata:

- `total`: The total number of records matching the provided query
- `totalPages`: The number of pages available (`total` / `posts_per_page`)
- `next`: A WPRequest object pre-bound to the next page of results
- `prev`: A WPRequest object pre-bound to the previous page of results
- `links`: an object containing the parsed `link` HTTP header data

The existence of the `_paging` property can be used as a flag to conditionally show or hide your paging UI, if necessary, as it will not be present for single-page or single-item responses.

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

#### SECURITY WARNING

Please be aware that basic authentication sends your username and password over the wire, in plain text. **We only recommend using basic authentication in production if you are securing your requests with SSL.**

More robust authentication methods will hopefully be added; we would welcome contributions in this area!

## API Documentation

In addition to the above getting-started guide, we have automatically-generated [API documentation](http://kadamwhite.github.io/wordpress-rest-api). More user-oriented documentation, including a more in-depth overview of available endpoint and filter methods, will be added to this README in the near future.


## Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/kadamwhite/wordpress-rest-api/issues). We're excited to see what the community thinks of this project, and we would love your input!

## Contributing

We welcome contributions large and small. See our [contributor guide](CONTRIBUTING.md) for more information.
