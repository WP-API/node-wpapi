'use strict';

var extend = require( 'node.extend' );

var buildRouteTree = require( './route-tree' ).build;
var generateEndpointFactories = require( './endpoint-factories' ).generate;
var paramSetter = require( './util/parameter-setter' );
var applyMixin = require( './util/apply-mixin' );
var mixins = require( './mixins' );

/**
 * Create and return a handler for an arbitrary WP REST API endpoint.
 *
 * The first two parameters mirror `register_rest_route` in the REST API
 * codebase:
 *
 * @memberof! WPAPI#
 * @param {string}   namespace         A namespace string, e.g. 'myplugin/v1'
 * @param {string}   restBase          A REST route string, e.g. '/author/(?P<id>\d+)'
 * @param {object}   [options]         An (optional) options object
 * @param {object}   [options.mixins]  A hash of functions to apply as mixins
 * @param {string[]} [options.methods] An array of methods to whitelist (on the leaf node only)
 * @returns {Function} An endpoint handler factory function for the specified route
 */
function registerRoute( namespace, restBase, options ) {
	// Support all methods until requested to do otherwise
	var supportedMethods = [ 'head', 'get', 'patch', 'put', 'post', 'delete' ];

	if ( options && Array.isArray( options.methods ) ) {
		// Permit supported methods to be specified as an array
		supportedMethods = options.methods.map(function( method ) {
			return method.trim().toLowerCase();
		});
	} else if ( options && typeof options.methods === 'string' ) {
		// Permit a supported method to be specified as a string
		supportedMethods = [ options.methods.trim().toLowerCase() ];
	}

	// Ensure that if GET is supported, then HEAD is as well, and vice-versa
	if ( supportedMethods.indexOf( 'get' ) !== -1 && supportedMethods.indexOf( 'head' ) === -1 ) {
		supportedMethods.push( 'head' );
	} else if ( supportedMethods.indexOf( 'head' ) !== -1 && supportedMethods.indexOf( 'get' ) === -1 ) {
		supportedMethods.push( 'get' );
	}

	var fullRoute = namespace
		// Route should always have preceding slash
		.replace( /^[\s/]*/, '/' )
		// Route should always be joined to namespace with a single slash
		.replace( /[\s/]*$/, '/' ) + restBase.replace( /^[\s/]*/, '' );

	var routeObj = {};
	routeObj[ fullRoute ] = {
		namespace: namespace,
		methods: supportedMethods
	};

	// Go through the same steps used to bootstrap the client to parse the
	// provided route out into a handler request method
	var routeTree = buildRouteTree( routeObj );
	// Parse the mock route object into endpoint factories
	var endpointFactories = generateEndpointFactories( routeTree )[ namespace ];
	var EndpointRequest = endpointFactories[ Object.keys( endpointFactories )[ 0 ] ].Ctor;

	if ( options && options.params ) {
		options.params.forEach(function( param ) {
			// Only accept string parameters
			if ( typeof param !== 'string' ) {
				return;
			}

			// If the parameter can be mapped to a mixin, apply that mixin
			if ( typeof mixins[ param ] === 'object' ) {
				Object.keys( mixins[ param ] ).forEach(function( key ) {
					applyMixin( EndpointRequest.prototype, key, mixins[ param ][ key ] );
				});
				return;
			}

			// Attempt to create a simple setter for any parameters for which
			// we do not already have a custom mixin
			applyMixin( EndpointRequest.prototype, param, paramSetter( param ) );
		});
	}

	// Set any explicitly-provided object mixins
	if ( options && typeof options.mixins === 'object' ) {

		// Set any specified mixin functions on the response
		Object.keys( options.mixins ).forEach(function( key ) {
			applyMixin( EndpointRequest.prototype, key, options.mixins[ key ] );
		});
	}

	function endpointFactory( options ) {
		/* jshint validthis:true */
		options = options || {};
		options = extend( options, this && this._options );
		return new EndpointRequest( options );
	}
	endpointFactory.Ctor = EndpointRequest;

	return endpointFactory;
}

module.exports = registerRoute;
