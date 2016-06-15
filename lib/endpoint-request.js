'use strict';

var inherit = require( 'util' ).inherits;
var WPRequest = require( './constructors/wp-request' );
var mixins = require( './mixins' );

function createEndpointRequest( handlerSpec, resource, namespace ) {

	// Create the constructor function for this endpoint
	function EndpointRequest( options ) {
		WPRequest.call( this, options );

		/**
		 * Semi-private instance property specifying the available URL path options
		 * for this endpoint request handler, keyed by ascending whole numbers.
		 *
		 * @property _levels
		 * @type {object}
		 * @private
		 */
		this._levels = handlerSpec._levels;

		// Configure handler for this endpoint's root URL path & set namespace
		this
			.setPathPart( 0, resource )
			.namespace( namespace );
	}

	inherit( EndpointRequest, WPRequest );

	// Mix in all available shortcut methods for GET request query parameters that
	// are valid within this endpoint tree
	if ( typeof handlerSpec._getArgs === 'object' ) {
		Object.keys( handlerSpec._getArgs ).forEach(function( supportedQueryParam ) {
			var mixinsForParam = mixins[ supportedQueryParam ];

			// Only proceed if there is a mixin available AND the specified mixins will
			// not overwrite any previously-set prototype method
			if ( mixinsForParam ) {
				Object.keys( mixinsForParam ).forEach(function( methodName ) {
					if ( ! EndpointRequest.prototype[ methodName ] ) {
						EndpointRequest.prototype[ methodName ] = mixinsForParam[ methodName ];
					}
				});
			}
		});
	}

	Object.keys( handlerSpec._setters ).forEach(function( setterFnName ) {
		if ( EndpointRequest.prototype[ setterFnName ] ) {
			console.warn( 'Warning: method .' + setterFnName + '() is already defined!' );
			console.warn( 'Cannot overwrite .' + resource + '().' + setterFnName + '() method' );
		} else {
			EndpointRequest.prototype[ setterFnName ] = handlerSpec._setters[ setterFnName ];
		}
	});

	return EndpointRequest;
}

module.exports = {
	create: createEndpointRequest
};
