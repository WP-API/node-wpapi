'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */

var extend = require( 'node.extend' );
var createResourceHandlerSpec = require( './resource-handler-spec' ).create;
var createEndpointRequest = require( './endpoint-request' ).create;

/**
 * Given an array of route definitions and a specific namespace for those routes,
 * recurse through the node tree representing all possible routes within the
 * provided namespace to define path value setters (and corresponding property
 * validators) for all possible variants of each resource's API endpoints.
 *
 * @param {string} namespace         The namespace string for these routes
 * @param {object} routesByNamespace A dictionary of namespace - route definition
 *                                   object pairs as generated from buildRouteTree,
 *                                   where each route definition object is a dictionary
 *                                   keyed by route definition strings
 * @returns {object} A dictionary of endpoint request handler factories
 */
function generateEndpointFactories( routesByNamespace ) {

	return Object.keys( routesByNamespace ).reduce(function( namespaces, namespace ) {
		var routeDefinitions = routesByNamespace[ namespace ];

		// Create
		namespaces[ namespace ] = Object.keys( routeDefinitions ).reduce(function( handlers, resource ) {

			var handlerSpec = createResourceHandlerSpec( routeDefinitions[ resource ], resource );

			var EndpointRequest = createEndpointRequest( handlerSpec, resource, namespace );

			// "handler" object is now fully prepared; create the factory method that
			// will instantiate and return a handler instance
			handlers[ resource ] = function( options ) {
				options = options || {};
				options = extend( options, this._options );
				return new EndpointRequest( options );
			};

			// Expose the constructor as a property on the factory function, so that
			// auto-generated endpoint request constructors may be further customized
			// when needed
			handlers[ resource ].Ctor = EndpointRequest;

			return handlers;
		}, {} );

		return namespaces;
	}, {} );
}

module.exports = {
	generate: generateEndpointFactories
};
