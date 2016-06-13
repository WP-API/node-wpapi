'use strict';

var inherit = require( 'util' ).inherits;
var CollectionRequest = require( '../shared/collection-request' );
var mixins = require( '../mixins' );

function makeEndpointRequest( handlerSpec, resource, namespace ) {

	// Create the constructor function for this endpoint
	function EndpointRequest( options ) {
		this._options = options || {};

		this._levels = handlerSpec._levels;
		this._path = {};

		// Configure handler for this endpoint
		this
			.setPathPart( 0, resource )
			.namespace( namespace );
	}

	inherit( EndpointRequest, CollectionRequest );

	// Mix in all available shortcut methods for GET request query parameters that
	// are valid within this endpoint tree
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

	Object.keys( handlerSpec._setters ).forEach(function( setterFnName ) {
		EndpointRequest.prototype[ setterFnName ] = handlerSpec._setters[ setterFnName ];
	});

	return EndpointRequest;
}

module.exports = makeEndpointRequest;
