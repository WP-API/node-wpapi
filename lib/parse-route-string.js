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
	'\\(\\?',
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

var routesByNamespace = Object.keys( routes ).reduce(function( namespaces, route ) {
	var nsForRoute = routes[ route ].namespace;
	// Do not make a namespace group for the API root
	if ( ! nsForRoute ) {
		return namespaces;
	}

	// Do not add the namespace root to its own group
	if ( '/' + nsForRoute === route ) {
		return namespaces;
	}

	// Ensure that the namespace object for this namespace exists
	if ( ! namespaces[ nsForRoute ] ) {
		namespaces[ nsForRoute ] = {};
	}

	// Get a local reference to namespace object
	var ns = namespaces[ nsForRoute ];

	// Strip the namespace from the route string (all routes should have the
	// format `/namespace/other/stuff`) @TODO: Validate this assumption
	var routeString = route.replace( '/' + nsForRoute + '/', '' );

	// If no route string, carry on
	if ( ! routeString ) { return namespaces; }

	var routeComponents = routeString.split( '/' );

	// If no components, carry on
	if ( ! routeComponents.length ) { return namespaces; }

	// The first element of the route tells us what type of resource this route
	// is for, e.g. "posts" or "comments": we build one handler per resource
	// type, so we group like resource paths together.
	var resource = routeComponents.shift();

	// @TODO: This code above currently precludes baseless routes, e.g.
	// myplugin/v2/(?P<resource>\w+) -- should those be supported?

	// Create an array to represent this resource, and ensure it is assigned
	// to the namespace object. The array will structure the "levels" (path
	// components and subresource types) of this resource's endpoint handler.
	var levels = ns[ resource ] || [];
	ns[ resource ] = levels;

	routeComponents.forEach(function( component, idx ) {
		if ( ! levels[ idx ] ) {
			levels.push({
				setters: []
			});
		}

		// Check to see if this component is a dynamic URL segment (i.e. defined by
		// a named capture group regular expression). namedGroup will be null if
		// the regexp does not match, or else an array defining the RegExp match, e.g.
		// [
		//   'P<id>[\\d]+)',
		//   'id', // Name of the group
		//   '[\\d]+', // regular expression for this URL segment's contents
		//   index: 15,
		//   input: '/wp/v2/posts/(?P<id>[\\d]+)'
		// ]
		var namedGroup = component.match( namedGroupRegexp );

		// Branch here: if we're NOT dealing with a dynamic URL component,
		if ( ! namedGroup ) {
			// then add a simple-case setter for whatever static string we're
			// dealing with here
			levels[ idx ].setters.push({
				name: component,
				validate: function( input ) {
					return input === component;
				}
			});

			// and move along.
			return;
		}

		// The approach below will not work. The reason it will not work is this:
		//
		//     /wp/v2/posts/(?P<id>[\\d]+)
		//     /wp/v2/posts/(?P<parent_id>[\\d]+)/revisions/(?P<id>[\\d]+)
		//
		// If we define a `.id()` setter to set the first "level" of the URL we are
		// building, then `id` is a taken name. The approach that we begin to build
		// out below has no way of tracking which setters are still "available," and
		// when we try to make a setter for the revision ID, it will will either
		// overwrite the post ID setter or else be dropped (neither of which would be
		// considered a successful outcome).
		//
		// We either need to construct a tree of these resources, a la
		//
		// - posts
		//   - id
		//     - revisions
		//       - id
		//     - meta
		//       - id
		//
		// or else keep more of a sense of what "level" we are dealing with, and work
		// inwards from leaf nodes so that we can bind a `.revisions()` method that
		// would return a collection if called with no arguments, or set `.id` with
		// a numeric argument; we can't be that smart unless we know where our leaf
		// nodes are, and which nodes they come off of.

		// // // If we ARE dealing with a named capture group, see whether the regexp
		// // // it is capturing is already accounted for: this is done because multiple
		// // // route strings may treat the same URL component with a different name, e.g.
		// // // '/wp/v2/posts/(?P<id>[\\d]+)' vs '/wp/v2/posts/(?P<parent_id>[\\d]+)/revisions'
		// // var reHandled = levels[ idx ].setters.reduce(function( isHandled, setter ) {
		// // 	if ( setter.re && setter.re === namedGroup[ 2 ] ) {
		// // 		return true;
		// // 	}
		// // 	return isHandled;
		// // }, false );
		// // var validationRegExp = new RegExp( '^' + namedGroup[ 2 ] + '$' );
		// // if ( ! reHandled ) {
		// // 	levels[ idx ].setters.push({
		// // 		name: namedGroup[ 1 ],
		// // 		re: namedGroup[ 2 ],
		// // 		validate: function( input ) {
		// // 			return validationRegExp.test( input );
		// // 		}
		// // 	});
		// // }
		// // If we ARE dealing with a named capture group, see whether there is already
		// // a handler with the provided name: we only want to bind one setter for "id"
		// // even if multiple routes specify this level as "id".
		// // it is capturing is already accounted for: this is done because multiple
		// // route strings may treat the same URL component with a different name, e.g.
		// // '/wp/v2/posts/(?P<id>[\\d]+)' vs '/wp/v2/posts/(?P<parent_id>[\\d]+)/revisions'
		// var reHandled = levels[ idx ].setters.reduce(function( isHandled, setter ) {
		// 	if ( setter.re && setter.re === namedGroup[ 2 ] ) {
		// 		return true;
		// 	}
		// 	return isHandled;
		// }, false );
		// var validationRegExp = new RegExp( '^' + namedGroup[ 2 ] + '$' );
		// if ( ! reHandled ) {
		// 	levels[ idx ].setters.push({
		// 		name: namedGroup[ 1 ],
		// 		re: namedGroup[ 2 ],
		// 		validate: function( input ) {
		// 			return validationRegExp.test( input );
		// 		}
		// 	});
		// }
	});

	namespaces[ nsForRoute ].routes = namespaces[ nsForRoute ].routes || [];
	namespaces[ nsForRoute ].routes.push( routeString );

	return namespaces;
}, {} );

console.log( routesByNamespace['wp/v2'] );
/*
Object.keys( routes ).forEach(function( route ) {
	// All routes will begin with
	var nsForRoute = routes[ route ].ns;
	// First of all, strip all initial slashes
	route = route.replace( /^\//, '' );
	// Next, remove the namespace, if it is currently prefixed
	route = route.replace( ns, '' );
})
*/
