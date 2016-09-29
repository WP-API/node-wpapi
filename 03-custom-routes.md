---
layout: page
title: Custom Routes
permalink: /custom-routes/
---

* TOC
{:toc}

Support for Custom Post Types is provided via the `.registerRoute` method. This method returns a handler function which can be assigned to your site instance as a method, and takes the [same namespace and route string arguments as `rest_register_route`](http://v2.wp-api.org/extending/adding/#bare-basics):

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

However not _every_ filtering method is available by default, so for convenience a configuration object may be passed to the `registerRoute` method with a `params` property specifying additional query parameters to support. This makes it very easy to add existing methods like `.filter()`, `.before()` or `.after()` to your own endpoints:

```js
site.handler = site.registerRoute( 'myplugin/v1', 'collection/(?P<id>)', {
    // Listing any of these parameters will assign the built-in
    // chaining method that handles the parameter:
    params: [ 'filter', 'before', 'after', 'author', 'parent', 'post' ]
});
// yields
site.handler().forPost( 8 ).author( 92 ).filter( 'etc', 'etera' )...
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