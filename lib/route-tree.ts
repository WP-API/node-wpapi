type RouteTreeNode = import( './types' ).RouteTreeNode;
type RouteDefinition = import( './types' ).RouteDefinition;
type RouteTreeLevels = import( './types' ).RouteTreeLevels;
type RouteTree = import( './types' ).RouteTree;

/**
 * @module route-tree
 */

import namedGroupRegexp = require( './util/named-group-regexp' );
import splitPath = require( './util/split-path' );
import ensure = require( './util/ensure' );
import objectReduce = require( './util/object-reduce' );

const namedGroupRE = namedGroupRegexp.namedGroupRE;

/**
 * Method to use when reducing route components array.
 *
 * @private
 * @param routeObj     A route definition object (set via .bind partial application)
 * @param topLevel     The top-level route tree object for this set of routes (set
 *                     via .bind partial application)
 * @param parentLevel  The memo object, which is mutated as the reducer adds
 *                     a new level handler for each level in the route
 * @param component    The string defining this route component
 * @param idx          The index of this component within the components array
 * @param components   The array of all components
 * @returns The child object of the level being reduced
 */
function reduceRouteComponents(
	routeObj: RouteDefinition,
	topLevel: RouteTreeLevels,
	parentLevel: Record<string, RouteTreeNode>,
	component: string,
	idx: number,
	components: string[],
): Record<string, RouteTreeNode> | undefined {
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
	//
	// Both capture groups are mandatory in namedGroupRE, so whenever `namedGroup`
	// is non-null, `groupName` and `groupPattern` are always real strings rather
	// than `null`; the casts below just narrow past the wider type of the
	// standalone `namedGroup && ...` expressions above.
	const levelKey = namedGroup ? ( ( groupPattern || groupName ) as string ) : component;

	// Level name on the other hand takes its value from the group's name, if
	// defined, and falls back to the component string to handle situations where
	// `component` is a collection (e.g. "revisions")
	const levelName = namedGroup ? ( groupName as string ) : component;

	// Check whether we have a preexisting node at this level of the tree, and
	// create a new level object if not. The component string is included so that
	// validators can throw meaningful errors as appropriate. (`validatePattern`
	// is completed by the unconditional assignment below, so the fallback
	// literal is cast rather than given a throwaway placeholder pattern.)
	const currentLevel: RouteTreeNode = parentLevel[ levelKey ] || {
		component: component,
		namedGroup: namedGroup ? true : false,
		level: idx,
		names: [],
	} as unknown as RouteTreeNode;

	// A level's "names" correspond to the list of strings which could describe
	// an endpoint's component setter functions: "id", "revisions", etc.
	if ( currentLevel.names.indexOf( levelName ) < 0 ) {
		currentLevel.names.push( levelName );
	}

	// A level's validate pattern is the source of the (case-insensitive) RegExp
	// used to check whether a value being set on the request URL is of the
	// proper type for the location in which it is specified: the group pattern
	// (anchored, for an exact match) if one was found, or else the component
	// string. An empty pattern means "accept any input without validation"
	// (the registerRoute case of a named group with no parameter validation).
	// The pattern is stored as a string, not compiled here, so that route
	// trees remain pure data and can be serialized at build time; the
	// validator function is derived in lib/resource-handler-spec.ts.
	//
	// Only one validate pattern is maintained for each node, because each node
	// is defined either by a string literal or by a specific regular expression.
	currentLevel.validatePattern = groupPattern === '' ?
		'' :
		( groupPattern ? '^' + groupPattern + '$' : component );

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
							// Reference param definition objects in the top _getArgs dictionary.
							// (Asserted non-null: TS can't carry the assignment above's
							// narrowing across these nested closures.)
							( topLevel._getArgs as Record<string, unknown> )[ argKey ] = endpoint.args[ argKey ];
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
 * @param namespaces The memo object that becomes a dictionary mapping API
 *                   namespaces to an object of the namespace's routes
 * @param routeObj   A route definition object
 * @param route      The string key of the `routeObj` route object
 * @returns The namespaces dictionary memo object
 */
function reduceRouteTree( namespaces: RouteTree, routeObj: RouteDefinition, route: string ): RouteTree {
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
	const resource = routeComponents[ 0 ];

	// @TODO: This code above currently precludes baseless routes, e.g.
	// myplugin/v2/(?P<resource>\w+) -- should those be supported?

	// Create an array to represent this resource, and ensure it is assigned
	// to the namespace object. The array will structure the "levels" (path
	// components and subresource types) of this resource's endpoint handler.
	ensure( ns, resource, {} );
	const levels = ns[ resource ];

	// `.bind()` can't infer the remaining-parameter signature correctly across
	// the whole reduce() chain (the leaf-node return is `undefined`, which
	// only ever feeds an iteration that never happens); the cast restates the
	// true call signature without changing reduceRouteComponents itself.
	const boundReduceComponents = reduceRouteComponents.bind( null, routeObj, levels ) as (
		parentLevel: Record<string, RouteTreeNode> | undefined,
		component: string,
		idx: number,
		components: string[],
	) => Record<string, RouteTreeNode> | undefined;

	// Recurse through the route components, mutating levels with information about
	// each child node encountered while walking through the routes tree and what
	// arguments (parameters) are available for GET requests to this endpoint.
	routeComponents.reduce( boundReduceComponents, levels );

	return namespaces;
}

/**
 * Build a route tree by reducing over a routes definition object from the API
 * root endpoint response object
 *
 * @alias module:lib/route-tree.build
 * @param routes A dictionary of routes keyed by route regex strings
 * @returns A dictionary, keyed by namespace, of resource handler
 * factory methods for each namespace's resources
 */
function buildRouteTree( routes: Record<string, RouteDefinition> ): RouteTree {
	return objectReduce( routes, reduceRouteTree, {} );
}

export = {
	build: buildRouteTree,
};
