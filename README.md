A WordPress REST API client for Node.js
=======================================

This is a client for the [WordPress REST API](http://wp-api.org/).

**This project is under active development**, and should be considered beta. [Issues](https://github.com/kadamwhite/wordpress-rest-api/issues) are welcome if you find something that doesn't work!

[![Build Status](https://api.travis-ci.org/kadamwhite/wordpress-rest-api.png?branch=master)](https://travis-ci.org/kadamwhite/wordpress-rest-api)

## Purpose

This library is designed to make it easy for your [Node.js](http://nodejs.org) application to request specific resources from a WordPress install. It uses a query builder-style syntax to let you craft the request being made to the WP-API endpoints, then returns the data to your application as a JavaScript object.

## Installation

Currently, this module only supports Node v0.10 & 0.11.

To use the library, install it with [npm](http://npmjs.org):
```bash
npm install --save wordpress-rest-api
```
Then, within your application's script files, `require` the module to gain access to it:
```javascript
var WP = require( 'wordpress-rest-api' );
```

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
// All posts:
wp.posts().filter( 'posts_per_page', -1 )...
// 20 latest posts:
wp.posts().filter( 'posts_per_page', 20 )...
```


## API Documentation

In addition to the above getting-started guide, we have automatically-generated [API documentation](http://kadamwhite.github.io/wordpress-rest-api). More user-oriented documentation, including a more in-depth overview of available endpoint and filter methods, will be added to this README in the near future.


## Issues

If you identify any errors in this module, or have an idea for an improvement, please [open an issue](https://github.com/kadamwhite/wordpress-rest-api/issues). We're excited to see what the community thinks of this project, and we would love your input!
