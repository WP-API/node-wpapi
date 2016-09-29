---
layout: page
title: Customizing HTTP Request Behavior
permalink: /customizing-http-request-behavior/
---

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