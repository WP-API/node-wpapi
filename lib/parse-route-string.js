'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */
var util = require( 'util' );
var _ = require( 'lodash' );
function logFull( obj ) {
	console.log( util.inspect( obj, {
		colors: true,
		depth: null
	}) );
}

var CollectionRequest = require( './shared/collection-request' );
var inherit = require( 'util' ).inherits;

// All valid routes in API v2 beta 11
var routes = require( './endpoint-response.json' ).routes;

function getValues( obj ) {
	return typeof obj === 'object' ? Object.keys( obj ).map(function( key ) {
		return obj[ key ];
	}) : [];
}

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

// logFull( routesByNamespace );

/*

I want to deduce the following API from this tree (or one like it):

wp.posts();                     /wp/v2/posts
wp.posts().id( 7 );             /wp/v2/posts/7
wp.posts().id().revisions();    /wp/v2/posts/7/revisions
wp.posts().id().revisions( 8 ); /wp/v2/posts/7/revisions/8

^ That last one's the tricky one: I can deduce that this parameter is "id", but
that param will already be taken by the post ID, so sub-collections have to be
set up as `.revisions()` to get the collection, and `.revisions( id )` to get a
specific resource.

*/


// Flailing around trying to parse all this below

function Handler( namespace, resource ) {
	this._namespace = namespace || '';
	// a path component is a "level"-keyed representation of the contents of
	// one section of the requested URL, e.g. `_path: { "0": 17 }` for
	// post ID #17
	this._path = {
		'0': resource
	};
	// A "level" is a level-keyed object representing the valid options for
	// one level of the resource URL
	this._levels = {};
	this._setters = {};
}

inherit( Handler, CollectionRequest );

Handler.prototype.setPathPart = function( level, val ) {
	if ( this._path[ level ] ) {
		throw new Error( 'Cannot overwrite value ' + this._path[ level ] );
	}
	this._path[ level ] = val;

	return this;
}

Handler.prototype.addLevelOption = function( level, obj ) {
	this._levels[ level ] = this._levels[ level ] || [];
	this._levels[ level ].push( obj );
};

/** WIP */
Handler.prototype.validate = function() {
	// Iterate through all _specified_ levels of this endpoint
	var specifiedLevels = Object.keys( this._path )
		.map(function( level ) {
			return parseInt( level, 10 );
		})
		.sort(function( a, b ) { return a - b; });

	var maxLevel = Math.max.apply( null, specifiedLevels );

	// Ensure that all necessary levels are specified
	var path = [];
	var valid = true;
	for ( var level = 0; level < maxLevel; level++ ) {
		if ( this._path[ level ] ) {
			path.push( this._path[ level ] );
		} else {
			path.push( ' ??? ' );
			valid = false;
		}
	}
	if ( ! valid ) {
		throw new Error( 'Incomplete URL! Missing component: ' + path.join( '/' ) );
	}
	console.log( path.join( '/' ) );
};

// Now that our namespace and levels object has been defined, recurse through
// the node tree representing all possible routes within that namespace to
// define the path value setters and corresponding validators for all possible
// variants of each resource's API endpoints
Object.keys( routesByNamespace ).forEach(function( namespace, idx ) {
	var nsRoutes = routesByNamespace[ namespace ];
	var endpointHandlers = Object.keys( nsRoutes ).reduce(function( handlers, resource ) {
		var handler = new Handler( namespace, resource );
		var levels = nsRoutes[ resource ];

		/**
		 * Walk the tree
		 * @param  {Object} node            A node object
		 * @param  {Object} [node.children] An object of child nodes
		 * // @return {isLeaf} A boolean indicating whether the processed node is a leaf
		 */
		function extractSetterFromNode( node ) {
			var dynamicChildren = getValues( node.children ).filter(function( childNode ) {
				return childNode.namedGroup === true;
			});

			// For each node, add its handler to the relevant "level" representation
			handler.addLevelOption( node.level, _.pick( node, 'validate', 'methods' ) );

			var setterFn;
			if ( node.namedGroup ) {
				/**
				 * Set a dymanic (named-group) path part of a query URL.
				 *
				 * @chainable
				 * @param  {String|Number} val The path part value to set
				 * @return {Object} The handler instance (for chaining)
				 */
				setterFn = function( val ) {
					/* jshint validthis:true */
					this.setPathPart( node.level, val );
					return this;
				};
			} else {
				/**
				 * Set a non-dymanic (non-named-group) path part of a query URL, and
				 * set the value of a subresource if an input value is provided and
				 * exactly one named-group child node exists.
				 *
				 * @example
				 *
				 *     // revisions() is a non-dynamic path part setter:
				 *     wp.posts().id( 4 ).revisions();       // Get posts/4/revisions
				 *     wp.posts().id( 4 ).revisions( 1372 ); // Get posts/4/revisions/1372
				 *
				 * @chainable
				 * @param  {String|Number} [val] The path part value to set (if provided)
				 *                               for a subresource within this resource
				 * @return {Object} The handler instance (for chaining)
				 */
				setterFn = function( val ) {
					/* jshint validthis:true */
					// If the path part is not a namedGroup, it should have exactly one
					// entry in the names array: use that as the value for this setter,
					// as it will usually correspond to a collection endpoint.
					this.setPathPart( node.level, node.names[ 0 ] );

					// If this node has exactly one dynamic child, this method may act as
					// a setter for that child node
					var dynamicChild = dynamicChildren.length === 1 && dynamicChildren[ 0 ];
					if ( typeof val !== 'undefined' && dynamicChild ) {
						this.setPathPart( dynamicChild.level, val );
					}
					return this;
				};
			}

			// First level is set implicitly
			if ( node.level > 0 ) {
				node.names.forEach(function( name ) {
					// camel-case the setter name
					var name = name
						.toLowerCase()
						.replace( /_\w/g, function( match ) {
							return match.replace( '_', '' ).toUpperCase();
						});
					// Don't overwrite previously-set methods
					if ( ! handler[ name ] ) {
						handler[ name ] = setterFn;
					}
				});
			}

			// console.log( node );
			if ( node.children ) {
				getValues( node.children ).map( extractSetterFromNode );
			}
		}

		getValues( levels ).map( extractSetterFromNode );

		handlers[ resource ] = handler;

		// logFull( handler );

		return handlers;
	}, {} );

	if ( endpointHandlers.posts ) {
		endpointHandlers.posts.id( 4 ).revisions( 52 ).validate();
	}

	// endpointHandlers.posts
});


// logFull( routesByNamespace );
