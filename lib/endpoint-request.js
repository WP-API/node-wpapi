/**
 * @module endpoint-request
 */
'use strict';

const WPRequest = require( './constructors/wp-request' );
const mixins = require( './mixins' );

const applyMixin = require( './util/apply-mixin' );

/**
 * Create an endpoint request handler constructor for a specific resource tree
 *
 * @method create
 * @param {Object} handlerSpec A resource handler specification object
 * @param {String} resource    The root resource of requests created from the returned factory
 * @param {String} namespace   The namespace string for the returned factory's handlers
 * @returns {Function} A constructor inheriting from {@link WPRequest}
 */
function createEndpointRequest( handlerSpec, resource, namespace ) {

	// Create the constructor function for this endpoint
	class EndpointRequest extends WPRequest {
		constructor( options ) {
			super( options );

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
	}

	// Mix in all available shortcut methods for GET request query parameters that
	// are valid within this endpoint tree
	if ( typeof handlerSpec._getArgs === 'object' ) {
		Object.keys( handlerSpec._getArgs ).forEach( ( supportedQueryParam ) => {
			const mixinsForParam = mixins[ supportedQueryParam ];

			// Only proceed if there is a mixin available AND the specified mixins will
			// not overwrite any previously-set prototype method
			if ( typeof mixinsForParam === 'object' ) {
				Object.keys( mixinsForParam ).forEach( ( methodName ) => {
					applyMixin( EndpointRequest.prototype, methodName, mixinsForParam[ methodName ] );
				} );
			}
		} );
	}

	Object.keys( handlerSpec._setters ).forEach( ( setterFnName ) => {
		// Only assign setter functions if they do not overwrite preexisting methods
		if ( ! EndpointRequest.prototype[ setterFnName ] ) {
			EndpointRequest.prototype[ setterFnName ] = handlerSpec._setters[ setterFnName ];
		}
	} );

	return EndpointRequest;
}

module.exports = {
	create: createEndpointRequest,
};
