node-wp-api
===========

A Node.js-based client for the [WordPress JSON API](http://wp-api.org/)

## Using The Client

The module is a constructor, so you can create an instance of the API client bound to the endpoint for your WordPress install:
```javascript
var WP = require( 'node-wp-api' );
var wp = new WP({ endpoint: 'http://src.wordpress-develop.dev' });
```
Once an instance is constructed, you can request posts using either a callback-style or promise-style syntax:
```javascript
wp.posts().get(function( err, data ) {
    if ( err ) { throw new Error( err ); }
    // do something with the returned posts
    console.log( data );
});
```

## API Documentation

We have automatically-generated API documentation at [kadamwhite.github.io/node-wp-api](http://kadamwhite.github.io/node-wp-api); more user-oriented documentation (including a proper getting started guide) will be added to this README in the near future.

The original working document describing our vision for the functionality of this library is [on this repository's wiki](https://github.com/kadamwhite/node-wp-api/wiki).


## Issues

https://github.com/kadamwhite/node-wp-api/issues
