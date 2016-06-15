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
var routes = require( './lib/data/endpoint-response.json' ).routes;
var buildRouteTree = require( './lib/route-tree' ).build;
var generateEndpointFactories = require( './lib/endpoint-factories' ).generate;

var defaults = {
	username: '',
	password: ''
};

// Pull in base module constructors
var WPRequest = require( './lib/constructors/wp-request' );

/**
 * The base constructor for the WP API service
 *
 * @class WP
 * @constructor
 * @uses PostsRequest
 * @uses TaxonomiesRequest
 * @uses UsersRequest
 * @param {Object} options An options hash to configure the instance
 * @param {String} options.endpoint The URI for a WP-API endpoint
 * @param {String} [options.username] A WP-API Basic Auth username
 * @param {String} [options.password] A WP-API Basic Auth password
 */
function WP( options ) {

	// Enforce `new`
	if ( this instanceof WP === false ) {
		return new WP( options );
	}

	this._options = extend( {}, defaults, options );

	if ( ! this._options.endpoint ) {
		throw new Error( 'options hash must contain an API endpoint URL string' );
	}

	// Ensure trailing slash on endpoint URI
	this._options.endpoint = this._options.endpoint.replace( /\/?$/, '/' );

	return this;
}

// Auto-generate default endpoint factories
var routesByNamespace = buildRouteTree( routes );
var endpointFactories = generateEndpointFactories( 'wp/v2', routesByNamespace[ 'wp/v2' ] );

// Apply all auto-generated endpoint factories to the WP object prototype
Object.keys( endpointFactories ).forEach(function( methodName ) {
	WP.prototype[ methodName ] = endpointFactories[ methodName ];
});

/**
 * Convenience method for making a new WP instance
 *
 * @example
 * These are equivalent:
 *
 *     var wp = new WP({ endpoint: 'http://my.blog.url/wp-json' });
 *     var wp = WP.site( 'http://my.blog.url/wp-json' );
 *
 * @method site
 * @static
 * @param {String} endpoint The URI for a WP-API endpoint
 * @return {WP} A new WP instance, bound to the provided endpoint
 */
WP.site = function( endpoint ) {
	return new WP({ endpoint: endpoint });
};

/**
 * Generate a request against a completely arbitrary endpoint, with no assumptions about
 * or mutation of path, filtering, or query parameters. This request is not restricted to
 * the endpoint specified during WP object instantiation.
 *
 * @example
 * Generate a request to the explicit URL "http://your.website.com/wp-json/some/custom/path" (yeah, we wish ;)
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

module.exports = WP;
