'use strict';

var pick = require( 'lodash' ).pick;
var getValues = require( 'lodash' ).values;
var generatePathPartSetter = require( './generate-path-part-setter' );

var logObj = require( './log-obj' );

function addLevelOption( levelsObj, level, obj ) {
	levelsObj[ level ] = levelsObj[ level ] || [];
	levelsObj[ level ].push( obj );
}

function assignSetterFnForNode( handler, node ) {
	var setterFn;

	// For each node, add its handler to the relevant "level" representation
	addLevelOption( handler._levels, node.level, pick( node, 'validate', 'methods' ) );

	// First level is set implicitly, no dedicated setter needed
	if ( node.level > 0 ) {

		setterFn = generatePathPartSetter( node );

		node.names.forEach(function( name ) {
			// camel-case the setter name
			var setterFnName = name
				.toLowerCase()
				.replace( /_\w/g, function( match ) {
					return match.replace( '_', '' ).toUpperCase();
				});

			// Don't overwrite previously-set methods
			if ( ! handler._setters[ setterFnName ] ) {
				handler._setters[ setterFnName ] = setterFn;
			}
		});
	}
}

/**
 * Walk the tree of a specific resource node to create the setter methods
 *
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
 * @param  {Object} node            A node object
 * @param  {Object} [node.children] An object of child nodes
 * // @return {isLeaf} A boolean indicating whether the processed node is a leaf
 */
function extractSetterFromNode( handler, node ) {

	assignSetterFnForNode( handler, node );

	if ( node.children ) {
		// Recurse down to this node's children
		getValues( node.children ).map( extractSetterFromNode.bind( null, handler ) );
	}
}

/**
 * Create a node handler specification object from a route definition object
 *
 * @param {object} routeDefinition A route definition object
 * @param {string} resource The string key of the resource for which to create a handler
 * @returns {object} A handler spec object with _path, _levels and _setters properties
 */
function createNodeHandlerSpec( routeDefinition, resource ) {

	var handler = {
		// A "path" is an ordered set of
		_path: {
			'0': resource
		},

		// A "level" is a level-keyed object representing the valid options for
		// one level of the resource URL
		_levels: {},

		// Objects that hold methods and properties which will be copied to
		// instances of this endpoint's handler
		_setters: {}
	};

	// Walk the tree
	getValues( routeDefinition ).map( extractSetterFromNode.bind( null, handler ) );

	return handler;
}

module.exports = {
	create: createNodeHandlerSpec,
	_extractSetterFromNode: extractSetterFromNode,
	_assignSetterFnForNode: assignSetterFnForNode,
	_addLevelOption: addLevelOption
};
