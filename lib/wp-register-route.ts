type RouteDefinition = import( './types' ).RouteDefinition;
type EndpointFactory = import( './types' ).EndpointFactory;
type EndpointFactoryContext = import( './types' ).EndpointFactoryContext;

/**
 * @module wp-register-route
 */

import buildRouteTreeModule = require( './route-tree' );
import generateEndpointFactoriesModule = require( './endpoint-factories' );
import paramSetter = require( './util/parameter-setter' );
import applyMixin = require( './util/apply-mixin' );
import mixins = require( './mixins' );

const buildRouteTree = buildRouteTreeModule.build;
const generateEndpointFactories = generateEndpointFactoriesModule.generate;

/**
 * Options accepted by registerRoute() to configure the generated endpoint
 * request handler.
 */
interface RegisterRouteOptions {
	mixins?: Record<string, unknown>;
	methods?: string | string[];
	params?: unknown[];
}

/**
 * Create and return a handler for an arbitrary WP REST API endpoint.
 *
 * The first two parameters mirror `register_rest_route` in the REST API
 * codebase:
 *
 * @memberof! WPAPI#
 * @param namespace          A namespace string, e.g. 'myplugin/v1'
 * @param restBase           A REST route string, e.g. '/author/(?P<id>\d+)'
 * @param [options]          An (optional) options object
 * @param [options.mixins]   A hash of functions to apply as mixins
 * @param [options.methods]  An array of methods to whitelist (on the leaf node only)
 * @returns An endpoint handler factory function for the specified route
 */
function registerRoute( namespace: string, restBase: string, options: RegisterRouteOptions = {} ): EndpointFactory {
	// Support all methods until requested to do otherwise
	let supportedMethods = [ 'head', 'get', 'patch', 'put', 'post', 'delete' ];

	if ( Array.isArray( options.methods ) ) {
		// Permit supported methods to be specified as an array
		supportedMethods = options.methods.map( method => method.trim().toLowerCase() );
	} else if ( typeof options.methods === 'string' ) {
		// Permit a supported method to be specified as a string
		supportedMethods = [ options.methods.trim().toLowerCase() ];
	}

	// Ensure that if GET is supported, then HEAD is as well, and vice-versa
	if ( supportedMethods.indexOf( 'get' ) !== -1 && supportedMethods.indexOf( 'head' ) === -1 ) {
		supportedMethods.push( 'head' );
	} else if ( supportedMethods.indexOf( 'head' ) !== -1 && supportedMethods.indexOf( 'get' ) === -1 ) {
		supportedMethods.push( 'get' );
	}

	const fullRoute = namespace
		// Route should always have preceding slash
		.replace( /^[\s/]*/, '/' )
		// Route should always be joined to namespace with a single slash
		.replace( /[\s/]*$/, '/' ) + restBase.replace( /^[\s/]*/, '' );

	const routeObj: Record<string, RouteDefinition> = {};
	routeObj[ fullRoute ] = {
		namespace: namespace,
		methods: supportedMethods,
	};

	// Go through the same steps used to bootstrap the client to parse the
	// provided route out into a handler request method
	const routeTree = buildRouteTree( routeObj );
	// Parse the mock route object into endpoint factories
	const endpointFactories = generateEndpointFactories( routeTree )[ namespace ];
	const EndpointRequest = endpointFactories[ Object.keys( endpointFactories )[ 0 ] ].Ctor;

	if ( options && options.params ) {
		options.params.forEach( ( param ) => {
			// Only accept string parameters
			if ( typeof param !== 'string' ) {
				return;
			}

			// If the parameter can be mapped to a mixin, apply that mixin
			if ( typeof mixins[ param ] === 'object' ) {
				Object.keys( mixins[ param ] ).forEach( ( key ) => {
					applyMixin( EndpointRequest.prototype, key, mixins[ param ][ key ] );
				} );
				return;
			}

			// Attempt to create a simple setter for any parameters for which
			// we do not already have a custom mixin
			applyMixin( EndpointRequest.prototype, param, paramSetter( param ) );
		} );
	}

	// Set any explicitly-provided object mixins
	if ( options && typeof options.mixins === 'object' ) {
		// Reference locally so its non-optional type carries into the forEach closure below.
		const mixinsOption = options.mixins;

		// Set any specified mixin functions on the response
		Object.keys( mixinsOption ).forEach( ( key ) => {
			applyMixin( EndpointRequest.prototype, key, mixinsOption[ key ] );
		} );
	}

	// Cast to EndpointFactory because the function literal doesn't yet carry
	// the `.Ctor` property assigned to it below.
	const endpointFactory = function( this: EndpointFactoryContext, options: Record<string, unknown> = {} ) {
		return new EndpointRequest( {
			...options,
			...( this ? this._options : {} ),
		} );
	} as EndpointFactory;
	endpointFactory.Ctor = EndpointRequest;

	return endpointFactory;
}

export = registerRoute;
