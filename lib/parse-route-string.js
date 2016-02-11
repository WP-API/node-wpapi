'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */

// All valid routes in API v2 beta 11
var routes = {
  '/':                                                           { namespace: '' },
  '/wp/v2':                                                      { namespace: 'wp/v2' },
  '/wp/v2/posts':                                                { namespace: 'wp/v2' },
  '/wp/v2/posts/(?P<id>[\\d]+)':                                 { namespace: 'wp/v2' },
  '/wp/v2/posts/(?P<parent_id>[\\d]+)/meta':                     { namespace: 'wp/v2' },
  '/wp/v2/posts/(?P<parent_id>[\\d]+)/meta/(?P<id>[\\d]+)':      { namespace: 'wp/v2' },
  '/wp/v2/posts/(?P<parent_id>[\\d]+)/revisions':                { namespace: 'wp/v2' },
  '/wp/v2/posts/(?P<parent_id>[\\d]+)/revisions/(?P<id>[\\d]+)': { namespace: 'wp/v2' },
  '/wp/v2/pages':                                                { namespace: 'wp/v2' },
  '/wp/v2/pages/(?P<id>[\\d]+)':                                 { namespace: 'wp/v2' },
  '/wp/v2/pages/(?P<parent_id>[\\d]+)/meta':                     { namespace: 'wp/v2' },
  '/wp/v2/pages/(?P<parent_id>[\\d]+)/meta/(?P<id>[\\d]+)':      { namespace: 'wp/v2' },
  '/wp/v2/pages/(?P<parent_id>[\\d]+)/revisions':                { namespace: 'wp/v2' },
  '/wp/v2/pages/(?P<parent_id>[\\d]+)/revisions/(?P<id>[\\d]+)': { namespace: 'wp/v2' },
  '/wp/v2/media':                                                { namespace: 'wp/v2' },
  '/wp/v2/media/(?P<id>[\\d]+)':                                 { namespace: 'wp/v2' },
  '/wp/v2/types':                                                { namespace: 'wp/v2' },
  '/wp/v2/types/(?P<type>[\\w-]+)':                              { namespace: 'wp/v2' },
  '/wp/v2/statuses':                                             { namespace: 'wp/v2' },
  '/wp/v2/statuses/(?P<status>[\\w-]+)':                         { namespace: 'wp/v2' },
  '/wp/v2/taxonomies':                                           { namespace: 'wp/v2' },
  '/wp/v2/taxonomies/(?P<taxonomy>[\\w-]+)':                     { namespace: 'wp/v2' },
  '/wp/v2/categories':                                           { namespace: 'wp/v2' },
  '/wp/v2/categories/(?P<id>[\\d]+)':                            { namespace: 'wp/v2' },
  '/wp/v2/tags':                                                 { namespace: 'wp/v2' },
  '/wp/v2/tags/(?P<id>[\\d]+)':                                  { namespace: 'wp/v2' },
  '/wp/v2/users':                                                { namespace: 'wp/v2' },
  '/wp/v2/users/(?P<id>[\\d]+)':                                 { namespace: 'wp/v2' },
  '/wp/v2/users/me':                                             { namespace: 'wp/v2' },
  '/wp/v2/comments':                                             { namespace: 'wp/v2' },
  '/wp/v2/comments/(?P<id>[\\d]+)':                              { namespace: 'wp/v2' }
};

// Regular Expression to identify a capture group in PCRE formats `(?<name>regex)`,
// `(?'name'regex)` or `(?P<name>regex)` (see regular-expressions.info/refext.html),
// built as a string to enable more detailed annotation.
var namedGroupRegexp = new RegExp([
	// Capture group start
	'\\(\?',
	// Capture group name begins either `P<`, `<` or `'`
	'(?:P<|<|\')',
	// Everything up to the next `>`` or `'` (depending) will be the capture group name
	'([^>\']+)',
	// Capture group end
	'[>\']',
	// Get everything up to the end of the capture group: this is the RegExp used
	// when matching URLs to this route, which we can use for validation purposes.
	'([^\\)]+)',
	// Capture group end
	'\\)'
].join( '' ) );

Object.keys( routes ).forEach(function( route ) {
	console.log( route.match( namedGroupRegexp ) );
});

var routesByNamespace = Object.keys( routes ).reduce(function( nsGroups, route ) {
	var nsForRoute = routes[ route ].namespace;
	if ( ! nsGroups[ nsForRoute ] ) {
		nsGroups[ nsForRoute ] = [];
	}
	nsGroups[ nsForRoute ].push( routes[ route ] );
});

Object.keys( routes ).forEach(function( route ) {
	// All routes will begin with
	var nsForRoute = routes[ route ].ns;
	// First of all, strip all initial slashes
	route = route.replace( /^\//, '' );
	// Next, remove the namespace, if it is currently prefixed
	route = route.replace( ns, '' );
})
