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
 * @param {Function} QueryBuilder  The base WPAPI query builder constructor
 * @param {Object}   httpTransport The HTTP transport object
 * @returns {Function} A WPAPI constructor with an associated HTTP transport
 */
module.exports = function( QueryBuilder, httpTransport ) {

	// Create a new constructor which inherits from WPAPI, but uses this transport
	class WPAPI extends QueryBuilder {}

	WPAPI.transport = Object.create( httpTransport );
	Object.freeze( WPAPI.transport );

	// Add a version of the base WPAPI.site() static method specific to this new constructor
	WPAPI.site = ( endpoint, routes ) => {
		return new WPAPI( {
			endpoint: endpoint,
			routes: routes,
		} );
	};

	/**
	 * Take an arbitrary WordPress site, deduce the WP REST API root endpoint, query
	 * that endpoint, and parse the response JSON. Use the returned JSON response
	 * to instantiate a WPAPI instance bound to the provided site.
	 *
	 * @memberof! WPAPI
	 * @static
	 * @param {string} url A URL within a REST API-enabled WordPress website
	 * @returns {Promise} A promise that resolves to a configured WPAPI instance bound
	 * to the deduced endpoint, or rejected if an endpoint is not found or the
	 * library is unable to parse the provided endpoint.
	 */
	WPAPI.discover = ( url ) => {
		// Use WPAPI.site to make a request using the defined transport
		const req = WPAPI.site( url ).root().param( 'rest_route', '/' );
		return req.get().then( ( apiRootJSON ) => {
			const routes = apiRootJSON.routes;
			return new WPAPI( {
				// Derive the endpoint from the self link for the / root
				endpoint: routes['/']._links.self,
				// Bootstrap returned WPAPI instance with the discovered routes
				routes: routes,
			} );
		} );
	};

	return WPAPI;
};
