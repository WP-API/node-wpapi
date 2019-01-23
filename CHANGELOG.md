# Changelog

## v2.0.0 [**alpha**] _Second Toughest in the Infants_

- **BREAKING**: The module exported as `wpapi` no longer includes HTTP methods. Install `superagent` as a peer dependency and `require( 'wpapi/superagent' )` in order to make HTTP requests.
- **BREAKING**: Autodiscovery now either succeeds or fails; a WPAPI instance configured with default routes will no longer be returned.


## v1.2.0 _Space Is Only Noise_

- **BREAKING**: The minimum supported node version is now v8.
- **BREAKING**: `._paging.total` and `._paging.totalPages` response properties are now returned as integers, not strings.
- Bundled route handlers are now available for new first-party endpoints in WordPress 5.0.
- The project now uses Jest and ESLint in place of Mocha, Chai, JSCS and JSHint. Thank you for your years of service, ["nyan" reporter](https://mochajs.org/#nyan)!
- Browser bundle size has been reduced.


## v1.1.2 _If I Survive_

- Resolves an issue where authentication credentials where not maintained properly when iterating through pages of a connection with `._paging.next` or `._paging.prev`, props @motleydev for the reproducible bug report
- Introduces a `--file` flag for the `update-default-routes-json` command-line script


## v1.1.1 _Music For The Masses_

- Resolves an issue where certain route paths would cause a fatal error in the route tree parser, props @obenland for diagnosing the bug


## v1.1.0 _Where's Your Head At_

- Implement a `.setHeader()` method for WPAPI and WPRequest objects to send arbitrary HTTP headers with outgoing API requests, props @anagio, @andreasvirkus, @gnarf, @Matthewnie, @mnivoliez, & @mzalewski
- Clarify CORS requirements in README, props @entr
- Improve inline documentation & switch from YUIDoc to JSDoc


## v1.0.3 _Couleurs Primaires_

- Properly parse API response text when response is sent back with Content-Type "text/html"


## v1.0.2 _Recto Verso_

- Upgrade Superagent dependency to avoid "double callback" error when JSON response contains extraneous HTML content
- Fix documentation inaccuracies following the merge of the REST API plugin into WordPress core

Patch release named for Paradis' 2016 LP "Recto Verso".


## v1.0.1 _The Only Constant is Change_

- Support endpoints using "plain permalinks", props @luisherranz

This patch release is named for _The Only Constant is Change_, a track from
v1.0 namesake album _Emotional Technology_ by BT.


## v1.0.0 _Emotional Technology_

- Add CHANGELOG.md
- Reduce complexity of, and rename, default routes JSON file
- **BREAKING**: Remove third "merge" argument from `.param()` method signature
- Document `.settings()` top-level route handler
- **BREAKING**: Return API error objects directly from HTTP transport: only return a transport-level error object in the event of a non-API error
- Add `.status()` parameter method mixin
- Properly register `.password()` and `.sticky()` parameter mixins
- Utilize the HTTP transport methods during auto-discovery process
- Replace `lodash.reduce` with custom `objectReduce` method throughout codebase to reduce browser bundle size

This release is named for BT's 2003 album _Emotional Technology_.


## v0.12.1 _You Only Live Once -Instrumental-_

This patch release fixes an issue where [valid post type identifiers](https://developer.wordpress.org/reference/functions/sanitize_key/) (or [PCRE capture group](http://www.regular-expressions.info/refext.html) names) are not properly intercepted and mapped to camelCase path part setters.

Props @gambry


## v0.12.0 _You Only Live Once_

This release makes breaking changes to how endpoint filtering methods are bound, specifically reacting to the removal of the `?filter` query parameter which is not present in WordPress 4.7's API endpoints.

New filtering methods:

* `.categories()`
* `.tags()`

Both of these methods support **querying by ID only**. If a slug is provided it will **not work** in 4.7, due to the removal of `filter`, unless the [rest-filter plugin](http://github.com/wp-api/rest-filter) is installed & active on the remote WordPress site.

**Deprecated** filtering methods:

* `.category()` (for filtering by associated terms; use `.tags()`)
* `.tag()` (for filtering by associated terms; use `.tags()`)

_Note:_ these method names may be retained, but the functionality which delegates to `.filter()` to query by term slug will be removed.

**Removed** filtering methods:

* `.name()`: use `.slug()` (deprecated previously)
* `.filter()`: available as a mixin but no longer enabled by default
* `.path()` (for Pages)

Props @joaojeronimo, @Ohar, @ryelle

This release is named for w.hatano's latest EP [_You Only Live Once_](https://www.youtube.com/watch?v=V7mnNdkhciQ)


## v0.11.0 _Super_

The theme for v0.11 is better parameter handling. Several parameters are now supported that apply to all default content routes, and this release also features a [complete overhaul](https://github.com/WP-API/node-wpapi#custom-routes) of the handling for registering mixins and custom query parameter setters with `.registerRoute()`.

**Parameter convenience methods**

`.order()`, `.orderby()`, `.offset()`, `.exclude()`, `.include()`, `.page()`, `.perPage()` and `.slug()` are now supported for _all_ request handlers generated by this library, not just for some resources.

**Setting Parameters on Custom Routes**

The `.param( name, val )` method is always available for custom route handler instances, but the convenience of `.filter` and other overloaded setters was not available to custom routes without some sleuthing through the code for this library (#203). To remedy this situation, a `params` array can now be provided on the `registerRoute` configuration object. If a method is available for a parameter (such as `filter`), it will be used; if no method exists, a setter for that property will be created:

```js
site.handler = site.registerRoute( 'myplugin/v1', 'collection/(?P<id>)', {
    params: [
      // Listing any of the parameters with built-in handlers will
      // assign that built-in chaining method to the route handler:
      'filter',
      'author',
      // `.customparam()` will be created as well, as a shortcut
      // for `.param( 'customparam', val )
      'customparam'
    ]
});
```

**Parameter convenience methods for Beta 14+ & beyond**

If you are running the bleeding-edge `develop` branch of the API, there is now a `.sticky( [boolean] )` method to support the new sticky posts handling recently added to the REST API.

If you are actually running the REST API plugin _in the future_, this library now also provides a `.password()` method for use in setting the password needed to access the content for a password-protected post. (The PR for adding that parameter should land later this week.)

This release is named for the Pet Shop Boys' latest album [_Super_](http://whatissuper.co/)

Props @edygar, @ludoo0d0a, @marcianosr, @sdgluck, and @stephanmax, for issues, PRs, feedback & discussions.


## v0.10.0 _Abaporu_

v0.10 standardizes the name of the constructor exposed by this module as "WPAPI", and creates a seam through which HTTP interactions can be customized or overridden. This release is named for Brazilian DJ Gui Boratto's fourth studio album _Abaporu_ (Kompakt, 2014).

**Module Naming**

The constructor exposed by this module should be referred to as `WPAPI` in all cases. This has been updated across the documentation site, source code, and examples within code comments.

There is remaining inconsistency throughout the docs & test suite between whether an _instance_ of `WPAPI` is referred to as `wp` or as `site`; this will not be addressed at this time, the identifier used to hold the WP site client instance is left up to the library consumer.

**Custom HTTP Transport Behavior**

Custom HTTP transport methods may be provided to inject or short-circuit HTTP behavior for each type of request; methods may be specified via a `.transport` property on the configuration object passed to the `WP` constructor, or by passing an object of transport methods to the `.transport()` method on the instantiated `WP` object.

Props @edygar


## v0.9.3 _Frontier Psychiatrist, 85% Instrumental_

Built bundles in `browser/` did not make it into previous publish!


## v0.9.2 _Frontier Psychiatrist_

- Added `.toString()` method to WPRequest objects, which returns the full
  rendered URI for a query
- Added `.before` and `.after` chaining methods to specify date queries
- Improvements to integration tests & documentation

**Deprecated Methods:**

- `._renderURI()` method on WPRequest object (use `.toString`)
- `.post()` HTTP method on WPRequest object (use `.create`)
- `.put()` HTTP method on WPRequest object (use `.update`)

**Props for this patch release:**

Issues, Bugs, Documentation Requests & Discussion: @BenHen75, @brianloveswords, @gnarf, @ludoo0d0a, @nodeGarden, @preschian, @sdgluck, @tommedema, @vtripolitakis, @wblaircox, @z-avanes

[I felt strangely hypnotized](https://www.youtube.com/watch?v=eS3AZ12xf6s)


## v0.9.1 _Since I Left You_

v0.9 brings two long-neglected features to the foreground: media support and browser-side usage. This release is named in homage to The Avalanches' absurdly brilliant _Since I Left You_.

**Media Handling**

`wp.media()` requests now provide a `.file()` chaining method, which can be used to specify the file system path of a file to upload (in node) or the contents of a file input (in a browser). This permits images and other media to be uploaded to the WordPress site in the same command which creates the media record.

**Browserify/Webpack Support**

Requiring `wpapi` as a dependency in a Browserified or Webpacked build now results in a much slimmer file bundle,

**Miscellaneous Fixes**

- Irritating warning messages generated on WP instantiation have been removed (reported by @elyobo)
- registerRoute no longer improperly lowercases camelCased path part setters (reported by @joneslloyd)
- The WP constructor now throws a nice error if the endpoint property is not a string, not just if it is falsy (props @sdgluck)
- JSDoc fix (props @sdgluck)

**Props**

For pull requests and patches: @bt, @sdgluck

For opening issues and asking or discussing questions: @elyobo, @joneslloyd, @mrkrumhausen, @satish9323, @smedegaard, @tommedema, @vtripolitakis, @z-avanes


## v0.9.0

(Note: v0.9.0 was beta only)


## v0.8.0 _New Eyes_

This release makes some key changes, adds some essential functionality, and re-wires things under the hood. I am unilaterally adopting the model of naming releases after albums, because I am releasing this in Vienna and "Mozart's House" by Clean Bandit (New Eyes, track 1) has been stuck in my head throughout WordCamp Europe.

**Autodiscovery**

Autodiscovery is now supported via the `WP.discover` method (#181)

**Bootstrapping**

If you already have the API response object you want to bootstrap with, the `.routes` property from it can now be passed in when calling `WP.site` or instantiating a `new WP` object (also #181, documented #182):

```js
var site = WP.site( 'http://my-endpoint.com/wp-json', endpointJSON.routes );
```

A script to ease the process of downloading this JSON object was added in PR #175

**registerRoute**

Arbitrary methods for custom endpoints can now be added without auto-discovery by using the `.registerRoute` method, which takes the same route configuration strings as `register_rest_route` in the API core.

**Internal Re-Architecture**

In #168 the innards of the library were totally gutted and re-written to support auto-discovery, registerRoute and bootstrapping.

**Human-Readable names for HTTP verbs**

`PUT` and `POST` are not the most intuitive words for what they do, and POST in particular caused a lot of semantic confusion with the post object within the WordPress data model. `.post` has become `.create`, and `.put` has become `.update`.

**Upgraded Dependencies**

Package dependencies and developer tools have all been updated to the latest version in their respective ranges.

**Props**

Props and gratitude to the community that submitted code, bugs, issues, questions, or comments that added to & informed this release.

For general advice and conceptual validation: @rmccue

For assisting with the discussion about how to handle autodiscovery
and custom route endpoints: @adamsilverstein, @aedensixty, @andreipot, @artoliukkonen, @BenHen75, @chrishutchinson, @elyobo, @gnarf, @ishaan-puniani, @jasonphillips, @joehoyle, @jupitercow, @timmyc

For opening issues and asking questions: @aedensixty, @dasheck0, @jsteranko, @nabeards, @satish9323, @stompweb


## v0.7.0

- Fix an improper value check in WP-Request (props @artoliukkonen)
- Fix URL typo in documentation (props @pdewouters)
- Do not include empty query parameters in generated query strings
- Remove .version() method, use .namespace() for both "namespace" AND
  "version" components of the URL
- Remove posts chaining methods that now refer to top-level collections
- Remove duplicate date query code
- Update integration test suite for v2 beta 12 post deletion changes
- Add documentation on integration test suite (props @elyobo)
- Improve structure of the contributors.md file to prioritize testing
- Add support for /comments collection (props @akira28)


## v0.6.0

(v0.6.0 was lost in the endless sea)


## v0.5.0

This release adds support for nonce-based authentication, useful when making API requests from the client side: props @gerhardsletten


## v0.4.0

adds .posts().meta() method


## v0.3.1

This release resolves an issue with the query string formatting encountered
when requesting posts of multiple types in the same query


## v0.3.0

The main new feature in 0.3.0 is initial support for collection pagination: Pagination data is exposed in a `_paging` property on response collections, if additional pages of collection objects are available.


## v0.2.3

This release adds basic support for working with paginated responses


## v0.2.2

This release improves the error handling around failed SuperAgent calls.
Many thanks to @bmac for the bug fix!


## v0.2.1

Added in this release:

- `wp.taxonomy()` convenience method for retrieving a taxonomy object
- `wp.categories()` convenience method for retrieving category terms
- `wp.tags()` convenience method for retrieving post_tag terms


## v0.2.0

- Force authentication where it would be convenient
- Add a /media endpoint handler method
- Add a .root() method for querying custom endpoints
- Add registerType custom post type request method generator
- Introduce CollectionRequest constructor
- Add support for `.param`s
- Changed PostsRequest to set comment targets via comment(), not id()
- Remove PATCH method handling from library (After discussion with @rmccue, the recommended way to request resource updates is via PUT)
- Add pages().path() method for querying by page path string
- Add pages endpoint handler and tests
- Add a method to get post type objects from /posts/types(/<type>)
- Fix hole in unit tests for WPRequest.then; closes #44
- Require Node.js >= 0.10 in package.json & add npm keywords
- Implementing structured route generation
- Add contributing guide
- Add NPM script aliases for the registered Grunt tasks
- Standardize constructor naming in README examples
- Add WP.site static convenience method for creating new sites


## v0.1.1

Initial Release
