'use strict';
/**
 * Take a WP route string (with PCRE named capture groups), such as
 * @module parseRouteString
 */

var extend = require( 'node.extend' );
var createResourceHandlerSpec = require( './resource-handler-spec' ).create;
var makeEndpointRequest = require( './make-endpoint-request' );

/**
 * Given an array of route definitions and a specific namespace for those routes,
 * recurse through the node tree representing all possible routes within the
 * provided namespace to define path value setters (and corresponding property
 * validators) for all possible variants of each resource's API endpoints.
 *
 * @param {string} namespace        The namespace string for these routes
 * @param {object} routeDefinitions A dictionary of route definitions from buildRouteTree
 * @returns {object} A dictionary of endpoint request handler factories
 */
function generateEndpointFactories( namespace, routeDefinitions ) {

	// Create
	return Object.keys( routeDefinitions ).reduce(function( handlers, resource ) {

		var handlerSpec = createResourceHandlerSpec( routeDefinitions[ resource ], resource );

		var EndpointRequest = makeEndpointRequest( handlerSpec, resource, namespace );

		// "handler" object is now fully prepared; create the factory method that
		// will instantiate and return a handler instance
		handlers[ resource ] = function( options ) {
			options = options || {};
			options = extend( options, this._options );
			return new EndpointRequest( options );
		};

		return handlers;
	}, {} );
}

module.exports = generateEndpointFactories;
