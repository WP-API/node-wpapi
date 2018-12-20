/**
 * @module route-tree
 */
'use strict';

const namedGroupRE = require( './util/named-group-regexp' ).namedGroupRE;
const splitPath = require( './util/split-path' );
const ensure = require( './util/ensure' );
const objectReduce = require( './util/object-reduce' );

/**
 * Method to use when reducing route components array.
 *
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
	const namedGroup = component.match( namedGroupRE );
	// Pull out references to the relevant indices of the match, for utility:
	// `null` checking is necessary in case the component did not match the RE,
	// hence the `namedGroup &&`.
	const groupName = namedGroup && namedGroup[ 1 ];
	const groupPattern = namedGroup && namedGroup[ 2 ];

	// When branching based on a dynamic capture group we used the group's RE
	// pattern as the unique identifier: this is done because the same group
	// could be assigned different names in different endpoint handlers, e.g.
	// "id" for posts/:id vs "parent_id" for posts/:parent_id/revisions.
	//
	// There is an edge case where groupPattern will be "" if we are registering
	// a custom route via `.registerRoute` that does not include parameter
	// validation. In this case we assume the groupName is sufficiently unique,
	// and fall back to `|| groupName` for the levelKey string.
	const levelKey = namedGroup ? ( groupPattern || groupName ) : component;

	// Level name on the other hand takes its value from the group's name, if
	// defined, and falls back to the component string to handle situations where
	// `component` is a collection (e.g. "revisions")
	const levelName = namedGroup ? groupName : component;

	// Check whether we have a preexisting node at this level of the tree, and
	// create a new level object if not. The component string is included so that
	// validators can throw meaningful errors as appropriate.
	const currentLevel = parentLevel[ levelKey ] || {
		component: component,
		namedGroup: namedGroup ? true : false,
		level: idx,
		names: [],
	};

	// A level's "names" correspond to the list of strings which could describe
	// an endpoint's component setter functions: "id", "revisions", etc.
	if ( currentLevel.names.indexOf( levelName ) < 0 ) {
		currentLevel.names.push( levelName );
	}

	// A level's validate method is called to check whether a value being set
	// on the request URL is of the proper type for the location in which it
	// is specified. If a group pattern was found, the validator checks whether
	// the input string exactly matches the group pattern.
	const groupPatternRE = groupPattern === '' ?
		// If groupPattern is an empty string, accept any input without validation
		/.*/ :
		// Otherwise, validate against the group pattern or the component string
		new RegExp( groupPattern ? '^' + groupPattern + '$' : component, 'i' );

	// Only one validate function is maintained for each node, because each node
	// is defined either by a string literal or by a specific regular expression.
	currentLevel.validate = input => groupPatternRE.test( input );

	// Check to see whether to expect more nodes within this branch of the tree,
	if ( components[ idx + 1 ] ) {
		// and create a "children" object to hold those nodes if necessary
		currentLevel.children = currentLevel.children || {};
	} else {
		// At leaf nodes, specify the method capabilities of this endpoint
		currentLevel.methods = ( routeObj.methods || [] ).map( str => str.toLowerCase() );

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
			routeObj.endpoints.forEach( ( endpoint ) => {
				// `endpoint.methods` will be an array of methods like `[ 'GET' ]`: we
				// only care about GET for this exercise. Validating POST and PUT args
				// could be useful but is currently deemed to be out-of-scope.
				endpoint.methods.forEach( ( method ) => {
					if ( method.toLowerCase() === 'get' ) {
						Object.keys( endpoint.args ).forEach( ( argKey ) => {
							// Reference param definition objects in the top _getArgs dictionary
							topLevel._getArgs[ argKey ] = endpoint.args[ argKey ];
						} );
					}
				} );
			} );
		}
	}

	// Return the child node object as the new "level"
	parentLevel[ levelKey ] = currentLevel;
	return currentLevel.children;
}

/**
 *
 * @private
 * @param {object}   namespaces The memo object that becomes a dictionary mapping API
 *                              namespaces to an object of the namespace's routes
 * @param {object}   routeObj   A route definition object
 * @param {string}   route      The string key of the `routeObj` route object
 * @returns {object} The namespaces dictionary memo object
 */
function reduceRouteTree( namespaces, routeObj, route ) {
	const nsForRoute = routeObj.namespace;

	const routeString = route
		// Strip the namespace from the route string (all routes should have the
		// format `/namespace/other/stuff`) @TODO: Validate this assumption
		.replace( '/' + nsForRoute + '/', '' )
		// Also strip any trailing "/?": the slash is already optional and a single
		// question mark would break the regex parser
		.replace( /\/\?$/, '' );

	// Split the routes up into hierarchical route components
	const routeComponents = splitPath( routeString );

	// Do not make a namespace group for the API root
	// Do not add the namespace root to its own group
	// Do not take any action if routeString is empty
	if ( ! nsForRoute || '/' + nsForRoute === route || ! routeString ) {
		return namespaces;
	}

	// Ensure that the namespace object for this namespace exists
	ensure( namespaces, nsForRoute, {} );

	// Get a local reference to namespace object
	const ns = namespaces[ nsForRoute ];

	// The first element of the route tells us what type of resource this route
	// is for, e.g. "posts" or "comments": we build one handler per resource
	// type, so we group like resource paths together.
	const resource = routeComponents[0];

	// @TODO: This code above currently precludes baseless routes, e.g.
	// myplugin/v2/(?P<resource>\w+) -- should those be supported?

	// Create an array to represent this resource, and ensure it is assigned
	// to the namespace object. The array will structure the "levels" (path
	// components and subresource types) of this resource's endpoint handler.
	ensure( ns, resource, {} );
	const levels = ns[ resource ];

	// Recurse through the route components, mutating levels with information about
	// each child node encountered while walking through the routes tree and what
	// arguments (parameters) are available for GET requests to this endpoint.
	routeComponents.reduce(
		reduceRouteComponents.bind( null, routeObj, levels ),
		levels
	);

	return namespaces;
}

/**
 * Build a route tree by reducing over a routes definition object from the API
 * root endpoint response object
 *
 * @method build
 * @param {object} routes A dictionary of routes keyed by route regex strings
 * @returns {object} A dictionary, keyed by namespace, of resource handler
 * factory methods for each namespace's resources
 */
function buildRouteTree( routes ) {
	return objectReduce( routes, reduceRouteTree, {} );
}

module.exports = {
	build: buildRouteTree,
};
