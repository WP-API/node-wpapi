---
layout: page
title: Authentication
permalink: /authentication/
---

* TOC
{:toc}

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
wp.posts().id( 817 ).auth( 'mcurie', 'nobel' ).get(...
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

When the library is loaded from the frontend of the WordPress site you are querying against, you can utilize the build in [Cookie authentication](http://wp-api.org/guides/authentication.html) supported by WP REST API.

First localize your scripts with an object with root-url and nonce in your theme's `functions.php` or your plugin:

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
var WPAPI = require( 'wpapi' );
var wp = new WPAPI({
    endpoint: window.WP_API_Settings.endpoint,
    nonce: window.WP_API_Settings.nonce
});
```