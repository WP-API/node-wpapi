/**
 * A WP REST API client for Node.js
 *
 * @example
 *     var wp = new WP({ endpoint: 'http://src.wordpress-develop.dev/wp-json' });
 *     wp.posts().then(function( posts ) {
 *         console.log( posts );
 *     }).catch(function( err ) {
 *         console.error( err );
 *     });
 *
 * @module WP
 * @main WP
 * @beta
 })
 */
'use strict';

var extend = require( 'node.extend' );

// All valid routes in API v2 beta 11
var defaultRoutes = require( './lib/data/endpoint-response.json' ).routes;
var buildRouteTree = require( './lib/route-tree' ).build;
var generateEndpointFactories = require( './lib/endpoint-factories' ).generate;

// The default endpoint factories will be lazy-loaded by parsing the default
// route tree data if a default-mode WP instance is created (i.e. one that
// is to be bootstrapped with the handlers for all of the built-in routes)
var defaultEndpointFactories;

var defaults = {
	username: '',
	password: ''
};

var apiDefaultNamespace = 'wp/v2';

// Pull in autodiscovery methods
var autodiscovery = require( './lib/autodiscovery' );

// Pull in base module constructors
var WPRequest = require( './lib/constructors/wp-request' );

/**
 * The base constructor for the WP API service
 *
 * @class WP
 * @constructor
 * @uses WPRequest
 * @param {Object} options An options hash to configure the instance
 * @param {String} options.endpoint The URI for a WP-API endpoint
 * @param {String} [options.username] A WP-API Basic Auth username
 * @param {String} [options.password] A WP-API Basic Auth password
 * @param {Object} [options.routes]   A dictionary of API routes with which to
 *                                    bootstrap the WP instance: the instance will
 *                                    be initialized with default routes only
 *                                    if this property is omitted
 */
function WP( options ) {

	// Enforce `new`
	if ( this instanceof WP === false ) {
		return new WP( options );
	}

	// Dictionary to be filled by handlers for default namespaces
	this._ns = {};

	this._options = extend( {}, defaults, options );

	if ( ! this._options.endpoint ) {
		throw new Error( 'options hash must contain an API endpoint URL string' );
	}

	// Ensure trailing slash on endpoint URI
	this._options.endpoint = this._options.endpoint.replace( /\/?$/, '/' );

	return this.bootstrap( options && options.routes );
}

/**
 * Convenience method for making a new WP instance
 *
 * @example
 * These are equivalent:
 *
 *     var wp = new WP({ endpoint: 'http://my.blog.url/wp-json' });
 *     var wp = WP.site( 'http://my.blog.url/wp-json' );
 *
 * `WP.site` can take an optional API root response JSON object to use when
 * bootstrapping the client's endpoint handler methods: if no second parameter
 * is provided, the client instance is assumed to be using the default API
 * with no additional plugins and is initialized with handlers for only those
 * default API routes.
 *
 * @example
 * These are equivalent:
 *
 *     // {...} means the JSON output of http://my.blog.url/wp-json
 *     var wp = new WP({
 *       endpoint: 'http://my.blog.url/wp-json',
 *       json: {...}
 *     });
 *     var wp = WP.site( 'http://my.blog.url/wp-json', {...} );
 *
 * @method site
 * @static
 * @param {String} endpoint The URI for a WP-API endpoint
 * @param {Object} routes   The "routes" object from the JSON object returned
 *                          from the root API endpoint of a WP site, which should
 *                          be a dictionary of route definition objects keyed by
 *                          the route's regex pattern
 * @return {WP} A new WP instance, bound to the provided endpoint
 */
WP.site = function( endpoint, routes ) {
	return new WP({
		endpoint: endpoint,
		routes: routes
	});
};

/**
 * Generate a request against a completely arbitrary endpoint, with no assumptions about
 * or mutation of path, filtering, or query parameters. This request is not restricted to
 * the endpoint specified during WP object instantiation.
 *
 * @example
 * Generate a request to the explicit URL "http://your.website.com/wp-json/some/custom/path"
 *
 *     wp.url( 'http://your.website.com/wp-json/some/custom/path' ).get()...
 *
 * @method url
 * @param {String} url The URL to request
 * @return {WPRequest} A WPRequest object bound to the provided URL
 */
WP.prototype.url = function( url ) {
	var options = extend( {}, this._options, {
		endpoint: url
	});
	return new WPRequest( options );
};

/**
 * Generate a query against an arbitrary path on the current endpoint. This is useful for
 * requesting resources at custom WP-API endpoints, such as WooCommerce's `/products`.
 *
 * @method root
 * @param {String} [relativePath] An endpoint-relative path to which to bind the request
 * @return {WPRequest} A request object
 */
WP.prototype.root = function( relativePath ) {
	relativePath = relativePath || '';
	var options = extend( {}, this._options );
	// Request should be
	var request = new WPRequest( options );

	// Set the path template to the string passed in
	request._path = { '0': relativePath };

	return request;
};

WP.prototype.auth = WPRequest.prototype.auth;

// Apply the registerRoute method to the prototype
WP.prototype.registerRoute = require( './lib/wp-register-route' );

/**
 * Deduce request methods from a provided API root JSON response object's
 * routes dictionary, and assign those methods to the current instance. If
 * no routes dictionary is provided then the instance will be bootstrapped
 * with route handlers for the default API endpoints only.
 *
 * This method is called automatically during WP instance creation.
 *
 * @method bootstrap
 * @chainable
 * @param {Object} routes The "routes" object from the JSON object returned
 *                        from the root API endpoint of a WP site, which should
 *                        be a dictionary of route definition objects keyed by
 *                        the route's regex pattern
 * @return {WP} The bootstrapped WP client instance (for chaining or assignment)
 */
WP.prototype.bootstrap = function( routes ) {
	var routesByNamespace;
	var endpointFactoriesByNamespace;

	if ( ! routes ) {
		// Auto-generate default endpoint factories if they are not already available
		if ( ! defaultEndpointFactories ) {
			routesByNamespace = buildRouteTree( defaultRoutes );
			defaultEndpointFactories = generateEndpointFactories( routesByNamespace );
		}
		endpointFactoriesByNamespace = defaultEndpointFactories;
	} else {
		routesByNamespace = buildRouteTree( routes );
		endpointFactoriesByNamespace = generateEndpointFactories( routesByNamespace );
	}

	// For each namespace for which routes were identified, store the generated
	// route handlers on the WP instance's private _ns dictionary. These namespaced
	// handler methods can be accessed by calling `.namespace( str )` on the
	// client instance and passing a registered namespace string.
	// Handlers for default (wp/v2) routes will also be assigned to the WP client
	// instance object itself, for brevity.
	return Object.keys( endpointFactoriesByNamespace ).reduce(function( wpInstance, namespace ) {
		var endpointFactories = endpointFactoriesByNamespace[ namespace ];

		// Set (or augment) the route handler factories for this namespace.
		wpInstance._ns[ namespace ] = Object.keys( endpointFactories ).reduce(function( nsHandlers, methodName ) {
			nsHandlers[ methodName ] = endpointFactories[ methodName ];
			return nsHandlers;
		}, wpInstance._ns[ namespace ] || {
			// Create all namespace dictionaries with a direct reference to the main WP
			// instance's _options property so that things like auth propagate properly
			_options: wpInstance._options
		} );

		// For the default namespace, e.g. "wp/v2" at the time this comment was
		// written, ensure all methods are assigned to the root client object itself
		// in addition to the private _ns dictionary: this is done so that these
		// methods can be called with e.g. `wp.posts()` and not the more verbose
		// `wp.namespace( 'wp/v2' ).posts()`.
		if ( namespace === apiDefaultNamespace ) {
			Object.keys( wpInstance._ns[ namespace ] ).forEach(function( methodName ) {
				wpInstance[ methodName ] = wpInstance._ns[ namespace ][ methodName ];
			});
		}

		return wpInstance;
	}, this );
};

/**
 * Access API endpoint handlers from a particular API namespace object
 *
 * @example
 *
 *     wp.namespace( 'myplugin/v1' ).author()...
 *
 *     // Default WP endpoint handlers are assigned to the wp instance itself.
 *     // These are equivalent:
 *     wp.namespace( 'wp/v2' ).posts()...
 *     wp.posts()...
 *
 * @param {string} namespace A namespace string
 * @returns {Object} An object of route endpoint handler methods for the
 * routes within the specified namespace
 */
WP.prototype.namespace = function( namespace ) {
	if ( ! this._ns[ namespace ] ) {
		throw new Error( 'Error: namespace ' + namespace + ' is not recognized' );
	}
	return this._ns[ namespace ];
};

/**
 * Take an arbitrary WordPress site, deduce the WP REST API root endpoint, query
 * that endpoint, and parse the response JSON. Use the returned JSON response
 * to instantiate a WP instance bound to the provided site.
 *
 * @method discover
 * @static
 * @param {string} url A URL within a WP endpoint
 * @return {Promise} A promise that resolves to a configured WP instance bound
 * to the deduced endpoint, or rejected if an endpoint is not found or the
 * library is unable to parse the provided endpoint.
 */
WP.discover = function( url ) {
	// local placeholder for API root URL
	var endpoint;

	return autodiscovery.getAPIRootFromURL( url )
		.then( autodiscovery.locateAPIRootHeader )
		.then(function( apiRootURL ) {
			// Set the function-scope variable that will be used to instantiate
			// the bound WP instance, then pass the URL on
			endpoint = apiRootURL;
			return apiRootURL;
		})
		.then( autodiscovery.getRootResponseJSON )
		.then(function( apiRootJSON ) {
			// Instantiate & bootstrap with the discovered methods
			return new WP({
				endpoint: endpoint,
				routes: apiRootJSON.routes
			});
		})
		.catch(function( err ) {
			console.error( 'Autodiscovery failed' );
			console.error( err );
			if ( endpoint ) {
				console.warn( 'Endpoint detected, proceeding despite error...' );
				console.warn( 'Binding to ' + endpoint + ' and assuming default routes' );
				return new WP.site( endpoint );
			}
			return null;
		});
};

module.exports = WP;
