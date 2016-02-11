'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */
var util = require( 'util' );

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
	var levels = ns[ resource ] || {};
	ns[ resource ] = levels;

	routeComponents.reduce(function( currentLevel, component, idx, components ) {
		// Check to see if this component is a dynamic URL segment (i.e. defined by
		// a named capture group regular expression). namedGroup will be `null` if
		// the regexp does not match, or else an array defining the RegExp match, e.g.
		// [
		//   'P<id>[\\d]+)',
		//   'id', // Name of the group
		//   '[\\d]+', // regular expression for this URL segment's contents
		//   index: 15,
		//   input: '/wp/v2/posts/(?P<id>[\\d]+)'
		// ]
		var namedGroup = component.match( namedGroupRegexp );
		// Pull out references to the relevant indices of the match, for utility:
		// `null` checking is necessary in case the component did not match the RE,
		// hence the `namedGroup &&`.
		var groupName = namedGroup && namedGroup[ 1 ];
		var groupPattern = namedGroup && namedGroup[ 2 ];

		// When branching based on a dynamic capture group we used the group's RE
		// pattern as the unique identifier: this is done because the same group
		// could be assigned different names in different endpoint handlers, e.g.
		// "id" for posts/:id vs "parent_id" for posts/:parent_id/revisions.
		var nextLevel = namedGroup ? groupPattern : component;

		// Check whether we have a preexisting node at this level of the tree, and
		// create a new level if not.
		currentLevel[ nextLevel ] = currentLevel[ nextLevel ] || {};

		// Check to see whether to expect more nodes within this branch of the tree,
		// and create a "children" object to hold those nodes if necessary
		if ( components[ idx + 1 ] ) {
			currentLevel[ nextLevel ].children = currentLevel[ nextLevel ].children || {};
		}

		// Return the child node object as the new "level"
		return currentLevel[ nextLevel ].children;
	}, levels );

	// namespaces[ nsForRoute ] = levels;
	// namespaces[ nsForRoute ].routes.push( routeString );

	return namespaces;
}, {} );

console.log( util.inspect( routesByNamespace, {
	depth: null
}) );

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
