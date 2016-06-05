'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */
var util = require( 'util' );
var _ = require( 'lodash' );

// function logFull( obj ) {
// 	console.log( util.inspect( obj, {
// 		colors: true,
// 		depth: null
// 	}) );
// }

var CollectionRequest = require( '../shared/collection-request' );
var inherit = util.inherits;
var extend = require( 'node.extend' );
var generatePathPartSetter = require( './generate-path-part-setter' );

// All valid routes in API v2 beta 11
var routes = require( '../data/endpoint-response.json' ).routes;

var getValues = require( 'lodash' ).values;

/*

"/wp/v2/posts": {},
"/wp/v2/posts/(?P<id>[\\d]+)": {},
"/wp/v2/posts/(?P<parent>[\\d]+)/revisions": {},
"/wp/v2/posts/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)": {},
"/wp/v2/pages": {},
"/wp/v2/pages/(?P<id>[\\d]+)": {},
"/wp/v2/pages/(?P<parent>[\\d]+)/revisions": {},
"/wp/v2/pages/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)": {},

 */

var buildRouteTree = require( './build-route-tree' );
var routesByNamespace = buildRouteTree( routes );

/*

I want to deduce the following API from this tree (or one like it):

wp.posts();                        /wp/v2/posts
wp.posts().id( 7 );                /wp/v2/posts/7
wp.posts().id( 7 ).revisions();    /wp/v2/posts/7/revisions
wp.posts().id( 7 ).revisions( 8 ); /wp/v2/posts/7/revisions/8

^ That last one's the tricky one: I can deduce that this parameter is "id", but
that param will already be taken by the post ID, so sub-collections have to be
set up as `.revisions()` to get the collection, and `.revisions( id )` to get a
specific resource.

*/

// Now that our namespace and levels object has been defined, recurse through
// the node tree representing all possible routes within that namespace to
// define the path value setters and corresponding validators for all possible
// variants of each resource's API endpoints

function addLevelOption( levelsObj, level, obj ) {
	levelsObj[ level ] = levelsObj[ level ] || [];
	levelsObj[ level ].push( obj );
}

function generateEndpointFactories( namespace, routesArr ) {
	console.log( routesArr );
	var endpointFactories = Object.keys( routesArr ).reduce(function( handlers, resource ) {

		var handler = {
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

		/**
		 * Walk the tree
		 * @param  {Object} node            A node object
		 * @param  {Object} [node.children] An object of child nodes
		 * // @return {isLeaf} A boolean indicating whether the processed node is a leaf
		 */
		function extractSetterFromNode( node ) {
			var setterFn;

			// For each node, add its handler to the relevant "level" representation
			addLevelOption( handler._levels, node.level, _.pick( node, 'validate', 'methods' ) );

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

			// console.log( node );
			if ( node.children ) {
				// Recurse down to this node's children
				getValues( node.children ).map( extractSetterFromNode );
			}
		}

		// Walk the tree
		getValues( routesArr[ resource ] ).map( extractSetterFromNode );

		// Create the constructor function for this endpoint
		function EndpointRequest( options ) {
			this._options = options || {};

			this._levels = handler._levels;
			this._path = {};

			// Configure handler for this endpoint
			this
				.setPathPart( 0, resource )
				.namespace( namespace );
		}
		inherit( EndpointRequest, CollectionRequest );

		console.log( handler );
		Object.keys( handler._setters ).forEach(function( setterFnName ) {
			EndpointRequest.prototype[ setterFnName ] = handler._setters[ setterFnName ];
		});

		// "handler" object is now fully prepared; create the factory method that
		// will instantiate and return a handler instance
		handlers[ resource ] = function( options ) {
			options = options || {};
			options = extend( options, this._options );
			return new EndpointRequest( options );
		};

		return handlers;
	}, {} );

	return endpointFactories;
}

var WP = generateEndpointFactories( 'wp/v2', routesByNamespace[ 'wp/v2' ] );
// console.log(
// 	WP.posts({
// 		endpoint: 'http://kadamwhite.com/wp-json'
// 	}).id( 4 ).revisions( 52 ).validatePath()._renderURI()
// );
// try {
// 	WP.posts().revisions( 52 ).validatePath()._renderURI();
// } catch ( e ) { console.error( e ); }
// console.log(
// 	WP.posts().id( 4 ).meta().filter( 'some', 'prop' )._renderURI()
// );

module.exports = WP;
