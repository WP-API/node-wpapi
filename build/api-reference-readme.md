## WPAPI Code Reference

Welcome to the API Reference for the `wpapi` NPM package.

Running `require( 'wpapi' )` returns the `WPAPI` constructor, which you can read about by clicking its name in the class list in the menu. Each request handler factory on `WPAPI` (such as `.posts()`, `.pages()`, _etc._) returns a `WPRequest` object, conditionally augmented with one or more mixins depending on the capabilities of the associated endpoints.

For user guides & tutorials, visit [wp-api.org/node-wpapi/](http://wp-api.org/node-wpapi).
