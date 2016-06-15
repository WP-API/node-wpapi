'use strict';

var namedGroupRegexp = require( './util/named-group-regexp' );
var ensure = require( './util/ensure' );

/**
 * Method to use when reducing route components array.
 *
 * @method _reduceRouteComponents
 * @private
 * @param {object} routeObj     A route definition object (set via .bind partial application)
 * @param {object} topLevel     The top-level route tree object for this set of routes (set
 *                              via .bind partial application)
 * @param {object} parentLevel  The memo object, which is mutated as the reducer adds
 *                              a new level handler for each level in the route
 * @param {string} component    The string defining this route component
 * @param {number} idx          The index of this component within the components array
 * @param {string[]} components The array of all components
 * @returns {object} The child object of the level being reduced
 */
function reduceRouteComponents( routeObj, topLevel, parentLevel, component, idx, components ) {
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
	//
	// There is an edge case where groupPattern will be "" if we are registering
	// a custom route via `.registerRoute` that does not include parameter
	// validation. In this case we assume the groupName is sufficiently unique,
	// and fall back to `|| groupName` for the levelKey string.
	var levelKey = namedGroup ? groupPattern : component || groupName;

	// Level name, on the other hand, would take its value from the group's name
	var levelName = namedGroup ? groupName : component;

	// Check whether we have a preexisting node at this level of the tree, and
	// create a new level object if not
	var currentLevel = parentLevel[ levelKey ] || {
		namedGroup: namedGroup ? true : false,
		level: idx,
		names: []
	};

	// A level's "name" corresponds to the list of strings which could describe
	// an endpoint's component setter functions: "id", "revisions", etc.
	if ( currentLevel.names.indexOf( levelName ) < 0 ) {
		currentLevel.names.push( levelName );
	}

	// Set the component, so that the validator can throw the appropriate error
	currentLevel.component = component;

	// A level's validate method is called to check whether a value being set
	// on the request URL is of the proper type for the location in which it
	// is specified. If a group pattern was found, the validator checks whether
	// the input string exactly matches the group pattern.
	var groupPatternRE = groupPattern === '' ?
		// If groupPattern is an empty string, accept any input without validation
		/.*/ :
		// Otherwise, validate against the group pattern or the component string
		new RegExp( groupPattern ? '^' + groupPattern + '$' : component, 'i' );

	// Only one validate function is maintained for each node, because each node
	// is defined either by a string literal or by a specific regular expression.
	currentLevel.validate = function( input ) {
		return groupPatternRE.test( input );
	};

	// Check to see whether to expect more nodes within this branch of the tree,
	if ( components[ idx + 1 ] ) {
		// and create a "children" object to hold those nodes if necessary
		currentLevel.children = currentLevel.children || {};
	} else {
		// At leaf nodes, specify the method capabilities of this endpoint
		currentLevel.methods = routeObj.methods ? routeObj.methods.map(function( str ) {
			return str.toLowerCase();
		}) : [];
		// Ensure HEAD is included whenever GET is supported: the API automatically
		// adds support for HEAD if you have GET
		if ( currentLevel.methods.indexOf( 'get' ) > -1 && currentLevel.methods.indexOf( 'head' ) === -1 ) {
			currentLevel.methods.push( 'head' );
		}

		// At leaf nodes also flag (at the top level) what arguments are
		// available to GET requests, so that we may automatically apply the
		// appropriate parameter mixins
		if ( routeObj.endpoints ) {
			topLevel._getArgs = topLevel._getArgs || {};
			routeObj.endpoints.forEach(function( endpoint ) {
				// endpoint.methods will be an array of methods like `[ 'GET' ]`: we
				// only care about GET for this exercise. Validating POST and PUT args
				// could be useful but is currently deemed to be out-of-scope.
				endpoint.methods.forEach(function( method ) {
					if ( method.toLowerCase() === 'get' ) {
						Object.keys( endpoint.args ).forEach(function( argKey ) {
							// For each argument, store whether it is required or not
							topLevel._getArgs[ argKey ] = endpoint.args[ argKey ].required;
						});
					}
				});
			});
		}

		// // Label node with the title of this endpoint's resource, if available
		// if ( routeObj.schema && routeObj.schema.title ) {
		// 	currentLevel.title = routeObj.schema.title;
		// }
	}

	// Return the child node object as the new "level"
	parentLevel[ levelKey ] = currentLevel;
	return currentLevel.children;
}

/**
 *
 * @method _reduceRouteTree
 * @private
 * @param {object[]} routes     An array of route objects (set via .bind partial application)
 * @param {object}   namespaces The memo object that becomes a dictionary mapping API
 *                              namespaces to an object of the namespace's routes
 * @param {string}   route      The string key of a route in `routes`
 * @returns {object} The namespaces dictionary memo object
 */
function reduceRouteTree( routes, namespaces, route ) {
	var routeObj = routes[ route ];
	var nsForRoute = routeObj.namespace;

	// Strip the namespace from the route string (all routes should have the
	// format `/namespace/other/stuff`) @TODO: Validate this assumption
	var routeString = route.replace( '/' + nsForRoute + '/', '' );
	var routeComponents = routeString.split( '/' );

	// Do not make a namespace group for the API root
	// Do not add the namespace root to its own group
	// Do not take any action if routeString is empty
	if ( ! nsForRoute || '/' + nsForRoute === route || ! routeString ) {
		return namespaces;
	}

	// Ensure that the namespace object for this namespace exists
	ensure( namespaces, nsForRoute, {} );

	// Get a local reference to namespace object
	var ns = namespaces[ nsForRoute ];

	// The first element of the route tells us what type of resource this route
	// is for, e.g. "posts" or "comments": we build one handler per resource
	// type, so we group like resource paths together.
	var resource = routeComponents[0];

	// @TODO: This code above currently precludes baseless routes, e.g.
	// myplugin/v2/(?P<resource>\w+) -- should those be supported?

	// Create an array to represent this resource, and ensure it is assigned
	// to the namespace object. The array will structure the "levels" (path
	// components and subresource types) of this resource's endpoint handler.
	ensure( ns, resource, {} );
	var levels = ns[ resource ];

	// Recurse through the route components, mutating levels with information about
	// each child node encountered while walking through the routes tree and what
	// arguments (parameters) are available for GET requests to this endpoint.
	routeComponents.reduce( reduceRouteComponents.bind( null, routeObj, levels ), levels );

	return namespaces;
}

function buildRouteTree( routes ) {
	return Object.keys( routes ).reduce( reduceRouteTree.bind( null, routes ), {} );
}

module.exports = {
	build: buildRouteTree
};
