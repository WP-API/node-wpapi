---
layout: page
title: Collection Pagination
permalink: /collection-pagination/
---

* TOC
{:toc}

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

### Using `offset`

If you prefer to think about your collections in terms of _offset_, or how many items "into" the collection you want to query, you can use the `offset` parameter (and parameter convenience method) instead of `page`. These are equivalent:

```js
// With .page()
wp.posts().perPage( 5 ).page( 3 )...
// With .offset()
wp.posts().perPage( 5 ).offset( 10 )...
```