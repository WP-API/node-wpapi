type HTTPTransport = import( './types' ).HTTPTransport;
type RouteDefinition = import( './types' ).RouteDefinition;

/**
 * @module bind-transport
 */

/**
 * Return a new constructor combining the path-building logic of WPAPI with
 * a specified HTTP transport layer
 *
 * This new constructor receives the .discover() static method, and the base
 * constructor's .site() static method is overridden to return instances of
 * the new transport-specific constructor
 *
 * See /fetch and /superagent directories
 *
 * @param QueryBuilder  The base WPAPI query builder constructor
 * @param httpTransport The HTTP transport object
 * @returns A WPAPI constructor with an associated HTTP transport
 */
// The TS mixin pattern requires a loosely-typed constructor constraint (arbitrary args & instance).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bindTransport<T extends new( ...args: any[] ) => any>( QueryBuilder: T, httpTransport: HTTPTransport ) {

	// Create a new constructor which inherits from WPAPI, but uses this transport
	class WPAPI extends QueryBuilder {

		static transport: HTTPTransport = Object.create( httpTransport );

		// Add a version of the base WPAPI.site() static method specific to this new constructor
		static site( endpoint: string, routes?: Record<string, RouteDefinition> ): InstanceType<T> {
			return new WPAPI( {
				endpoint: endpoint,
				routes: routes,
			} );
		}

		/**
		 * Take an arbitrary WordPress site, deduce the WP REST API root endpoint, query
		 * that endpoint, and parse the response JSON. Use the returned JSON response
		 * to instantiate a WPAPI instance bound to the provided site.
		 *
		 * @memberof! WPAPI
		 * @static
		 * @param url A URL within a REST API-enabled WordPress website
		 * @returns A promise that resolves to a configured WPAPI instance bound
		 * to the deduced endpoint, or rejected if an endpoint is not found or the
		 * library is unable to parse the provided endpoint.
		 */
		static discover( url: string ): Promise<InstanceType<T>> {
			// Use WPAPI.site to make a request using the defined transport
			const req = WPAPI.site( url ).root().param( 'rest_route', '/' );
			// An API root response's routes/links shape varies across WP core versions and plugins.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return req.get().then( ( apiRootJSON: any ) => {
				const routes = apiRootJSON.routes;
				// The root's self link is a bare string in older WP but an array of
				// link objects ([ { href } ]) in current WP; accept either shape.
				const self = routes[ '/' ]._links.self;
				const endpoint = Array.isArray( self ) ? self[ 0 ].href : self;
				return new WPAPI( {
					endpoint: endpoint,
					// Bootstrap returned WPAPI instance with the discovered routes
					routes: routes,
				} );
			} );
		}

	}

	Object.freeze( WPAPI.transport );

	return WPAPI;
}

export = bindTransport;
