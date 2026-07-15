type HandlerSpec = import( './types' ).HandlerSpec;
type EndpointRequestCtor = import( './types' ).EndpointRequestCtor;

/**
 * @module endpoint-request
 */

import WPRequest = require( './constructors/wp-request' );
import mixins = require( './mixins' );
import applyMixin = require( './util/apply-mixin' );

// WPRequest's constructor options shape, inferred from its own JSDoc since the
// module itself is still untyped @ts-nocheck JS.
type WPRequestOptions = ConstructorParameters<typeof WPRequest>[ 0 ];

/**
 * Create an endpoint request handler constructor for a specific resource tree
 *
 * @alias module:lib/endpoint-request.create
 * @param handlerSpec A resource handler specification object
 * @param resource    The root resource of requests created from the returned factory
 * @param namespace   The namespace string for the returned factory's handlers
 * @returns A constructor inheriting from {@link WPRequest}
 */
function createEndpointRequest( handlerSpec: HandlerSpec, resource: string, namespace: string ): EndpointRequestCtor {

	// Create the constructor function for this endpoint
	class EndpointRequest extends WPRequest {
		/**
		 * Semi-private instance property specifying the available URL path options
		 * for this endpoint request handler, keyed by ascending whole numbers.
		 *
		 * @property _levels
		 * @type {object}
		 * @private
		 */
		_levels: HandlerSpec[ '_levels' ];

		constructor( options: WPRequestOptions ) {
			super( options );

			this._levels = handlerSpec._levels;

			// Configure handler for this endpoint's root URL path & set namespace
			this
				.setPathPart( 0, resource )
				.namespace( namespace );
		}
	}

	// EndpointRequest's instance shape has no index signature, so the prototype
	// (mutated below to add setters and mixins) is cast to a plain dictionary.
	const prototype = EndpointRequest.prototype as unknown as Record<string, unknown>;

	// Mix in all available shortcut methods for GET request query parameters that
	// are valid within this endpoint tree
	if ( typeof handlerSpec._getArgs === 'object' ) {
		Object.keys( handlerSpec._getArgs ).forEach( ( supportedQueryParam ) => {
			const mixinsForParam = mixins[ supportedQueryParam ];

			// Only proceed if there is a mixin available AND the specified mixins will
			// not overwrite any previously-set prototype method
			if ( typeof mixinsForParam === 'object' ) {
				Object.keys( mixinsForParam ).forEach( ( methodName ) => {
					applyMixin( prototype, methodName, mixinsForParam[ methodName ] );
				} );
			}
		} );
	}

	Object.keys( handlerSpec._setters ).forEach( ( setterFnName ) => {
		// Only assign setter functions if they do not overwrite preexisting methods
		if ( ! prototype[ setterFnName ] ) {
			prototype[ setterFnName ] = handlerSpec._setters[ setterFnName ];
		}
	} );

	// EndpointRequestCtor is a shared, deliberately loose shape (its instance
	// type is `unknown`, reused by later, non-resource-specific consumers);
	// EndpointRequest's real constructor requires WPRequest's specific options
	// shape, so the cast just widens back to that shared shape.
	return EndpointRequest as EndpointRequestCtor;
}

export = {
	create: createEndpointRequest,
};
