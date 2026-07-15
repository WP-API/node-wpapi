type RouteTree = import( './types' ).RouteTree;
type EndpointFactory = import( './types' ).EndpointFactory;
type EndpointFactoryContext = import( './types' ).EndpointFactoryContext;

/**
 * Take a WP route string (with PCRE named capture groups), `such as /author/(?P<id>\d+)`,
 * and generate request handler factory methods for each represented endpoint.
 *
 * @module endpoint-factories
 */

import resourceHandlerSpec = require( './resource-handler-spec' );
import endpointRequest = require( './endpoint-request' );
import objectReduce = require( './util/object-reduce' );

const createResourceHandlerSpec = resourceHandlerSpec.create;
const createEndpointRequest = endpointRequest.create;

/**
 * Given a dictionary of route trees keyed by namespace, recurse through the
 * node tree representing all possible routes within each namespace to define
 * path value setters (and corresponding property validators) for all possible
 * variants of each resource's API endpoints.
 *
 * @alias module:lib/endpoint-factories.generate
 * @param routesByNamespace A dictionary of namespace - route definition
 *                           object pairs as generated from buildRouteTree,
 *                           where each route definition object is a dictionary
 *                           keyed by route definition strings
 * @returns A dictionary of endpoint request handler factories
 */
function generateEndpointFactories( routesByNamespace: RouteTree ): Record<string, Record<string, EndpointFactory>> {

	return objectReduce( routesByNamespace, ( namespaces, routeDefinitions, namespace ) => {

		// Create
		namespaces[ namespace ] = objectReduce( routeDefinitions, ( handlers, routeDef, resource ) => {

			const handlerSpec = createResourceHandlerSpec( routeDef, resource );

			const EndpointRequest = createEndpointRequest( handlerSpec, resource, namespace );

			// "handler" object is now fully prepared; create the factory method that
			// will instantiate and return a handler instance. Cast to EndpointFactory
			// because the function literal doesn't yet carry the `.Ctor` property
			// assigned to it below.
			handlers[ resource ] = function( this: EndpointFactoryContext, options?: Record<string, unknown> ) {
				return new EndpointRequest( {
					...this._options,
					...options,
				} );
			} as EndpointFactory;

			// Expose the constructor as a property on the factory function, so that
			// auto-generated endpoint request constructors may be further customized
			// when needed
			handlers[ resource ].Ctor = EndpointRequest;

			return handlers;
		}, {} as Record<string, EndpointFactory> );

		return namespaces;
	}, {} as Record<string, Record<string, EndpointFactory>> );
}

export = {
	generate: generateEndpointFactories,
};
