type RouteTreeNode = import( './types' ).RouteTreeNode;
type RouteTreeLevels = import( './types' ).RouteTreeLevels;
type HandlerSpec = import( './types' ).HandlerSpec;
type LevelOption = import( './types' ).LevelOption;
type PathPartSetterFn = import( './types' ).PathPartSetterFn;

/**
 * @module resource-handler-spec
 */

import pathPartSetter = require( './path-part-setter' );

const createPathPartSetter = pathPartSetter.create;

/** @private */
function addLevelOption( levelsObj: Record<number, LevelOption[]>, level: number, obj: LevelOption ): void {
	levelsObj[ level ] = levelsObj[ level ] || [];
	levelsObj[ level ].push( obj );
}

/**
 * Assign a setter function for the provided node to the provided route
 * handler object setters dictionary (mutates handler by reference).
 *
 * @private
 * @param handler A route handler definition object
 * @param node    A route hierarchy level node object
 */
function assignSetterFnForNode( handler: HandlerSpec, node: RouteTreeNode ): void {
	let setterFn: PathPartSetterFn;

	// For each node, add its handler to the relevant "level" representation
	addLevelOption( handler._levels, node.level, {
		component: node.component,
		validate: node.validate,
		methods: node.methods,
	} );

	// First level is set implicitly, no dedicated setter needed
	if ( node.level > 0 ) {

		setterFn = createPathPartSetter( node );

		node.names.forEach( ( name ) => {
			// Convert from snake_case to camelCase
			const setterFnName = name.replace(
				/[_-]+\w/g,
				match => match.replace( /[_-]+/, '' ).toUpperCase(),
			);

			// Don't overwrite previously-set methods
			if ( ! handler._setters[ setterFnName ] ) {
				handler._setters[ setterFnName ] = setterFn;
			}
		} );
	}
}

/**
 * Walk the tree of a specific resource node to create the setter methods
 *
 * The API we want to produce from the node tree looks like this:
 *
 *     wp.posts();                        /wp/v2/posts
 *     wp.posts().id( 7 );                /wp/v2/posts/7
 *     wp.posts().id( 7 ).revisions();    /wp/v2/posts/7/revisions
 *     wp.posts().id( 7 ).revisions( 8 ); /wp/v2/posts/7/revisions/8
 *
 * ^ That last one's the tricky one: we can deduce that this parameter is "id", but
 * that param will already be taken by the post ID, so sub-collections have to be
 * set up as `.revisions()` to get the collection, and `.revisions( id )` to get a
 * specific resource.
 *
 * @private
 * @param handler        A handler spec object, mutated by reference
 * @param node           A node object
 * @param [node.children] An object of child nodes
 */
function extractSetterFromNode( handler: HandlerSpec, node: RouteTreeNode ): void {

	assignSetterFnForNode( handler, node );

	if ( node.children ) {
		// Recurse down to this node's children. Reference `children` locally
		// so its non-optional type carries into the forEach closure below.
		const children = node.children;
		Object.keys( children ).forEach( ( key ) => {
			extractSetterFromNode( handler, children[ key ] );
		} );
	}
}

/**
 * Create a node handler specification object from a route definition object
 *
 * @alias module:lib/resource-handler-spec.create
 * @param routeDefinition A route definition object
 * @param resource The string key of the resource for which to create a handler
 * @returns A handler spec object with _path, _levels and _setters properties
 */
function createNodeHandlerSpec( routeDefinition: RouteTreeLevels, resource: string ): HandlerSpec {

	const handler: HandlerSpec = {
		// A "path" is an ordered (by key) set of values composed into the final URL
		_path: {
			'0': resource,
		},

		// A "level" is a level-keyed object representing the valid options for
		// one level of the resource URL
		_levels: {},

		// Objects that hold methods and properties which will be copied to
		// instances of this endpoint's handler
		_setters: {},

		// Arguments (query parameters) that may be set in GET requests to endpoints
		// nested within this resource route tree, used to determine the mixins to
		// add to the request handler
		_getArgs: routeDefinition._getArgs,
	};

	// Walk the tree
	Object.keys( routeDefinition ).forEach( ( routeDefProp ) => {
		if ( routeDefProp !== '_getArgs' ) {
			extractSetterFromNode( handler, routeDefinition[ routeDefProp ] );
		}
	} );

	return handler;
}

export = {
	create: createNodeHandlerSpec,
};
