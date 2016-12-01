---
layout: page
title: Using the Client
permalink: /using-the-client/
---

* TOC
{:toc}

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

It is also possible to leverage the [capability discovery](http://v2.wp-api.org/guide/discovery/) features of the API to automatically detect and add setter methods for your custom routes, or routes added by plugins.

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

To create a slimmed JSON file dedicated to this particular purpose, see the Node script [lib/data/generate-endpoint-response-json.js](lib/data/generate-endpoint-response-json.js), which will let you download and save an endpoint response to your local project.

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

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource on the [WP REST API Documentation Website](http://v2.wp-api.org/reference/).

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

This will work in the same manner for resources other than `post`: you can see the list of required data parameters for each resource on the [WP REST API Documentation Website](http://v2.wp-api.org/reference/).

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
    - `wp.users()`: get a collection of registered users
    - `wp.users().id( n )`: get the user with ID *n* (does not require authentication if that user is a published author within the blog)
    - `wp.users().me()`: get the authenticated user's record
* **media**
    - `wp.media()`: get a collection of media objects (attachments)
    - `wp.media().id( n )`: get media object with ID *n*

For security reasons, methods like `.revisions()` and `.users()` require the request to be authenticated.

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

#### Other Filters

The `?filter` query parameter is not natively supported within the WordPress core REST API endpoints, but can be added to your site using a plugin. `filter` is a special query parameter that lets you directly specify many WP_Query arguments, including `tag`, `author_name`, and other [public query vars](https://codex.wordpress.org/WordPress_Query_Vars). Even more parameters are available for use with `filter` if you [authenticate with the API](http://v2.wp-api.org/guide/authentication/).

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