'use strict';

var inherit = require( 'util' ).inherits;
var CollectionRequest = require( '../shared/collection-request' );

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

	Object.keys( handlerSpec._setters ).forEach(function( setterFnName ) {
		EndpointRequest.prototype[ setterFnName ] = handlerSpec._setters[ setterFnName ];
	});

	return EndpointRequest;
}

module.exports = makeEndpointRequest;
