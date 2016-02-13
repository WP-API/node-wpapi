'use strict';

var getValues = require( 'lodash' ).values;

function generatePathPartSetter( node ) {
	var dynamicChildren = getValues( node.children ).filter(function( childNode ) {
		return childNode.namedGroup === true;
	});

	if ( node.namedGroup ) {
		/**
		 * Set a dymanic (named-group) path part of a query URL.
		 *
		 * @chainable
		 * @param  {String|Number} val The path part value to set
		 * @return {Object} The handler instance (for chaining)
		 */
		return function( val ) {
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
		return function( val ) {
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
}

module.exports = generatePathPartSetter;
