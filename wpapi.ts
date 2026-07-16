type WPRequestOptions = import( './lib/types' ).WPRequestOptions;
type HTTPTransport = import( './lib/types' ).HTTPTransport;
type RouteDefinition = import( './lib/types' ).RouteDefinition;
type RouteTree = import( './lib/types' ).RouteTree;
type EndpointFactory = import( './lib/types' ).EndpointFactory;

/**
 * A WP REST API client for Node.js
 *
 * @example
 *     var wp = new WPAPI({ endpoint: 'http://src.wordpress-develop.dev/wp-json' });
 *     wp.posts().then(function( posts ) {
 *         console.log( posts );
 *     }).catch(function( err ) {
 *         console.error( err );
 *     });
 *
 * @license MIT
 */

import objectReduce = require( './lib/util/object-reduce' );

// The route tree for all valid default API routes, pre-parsed at build time
// from lib/data/default-routes.json by build/scripts/precompute-default-routes.js
// so that default-mode instances skip route parsing entirely.
import defaultRouteTree = require( './lib/data/default-route-tree.json' );
import routeTreeModule = require( './lib/route-tree' );
import endpointFactoriesModule = require( './lib/endpoint-factories' );
import registerRoute = require( './lib/wp-register-route' );

const buildRouteTree = routeTreeModule.build;
const generateEndpointFactories = endpointFactoriesModule.generate;

// Pull in base module constructors
import WPRequest = require( './lib/constructors/wp-request' );

// The default endpoint factories will be lazy-loaded by parsing the default
// route tree data if a default-mode WPAPI instance is created (i.e. one that
// is to be bootstrapped with the handlers for all of the built-in routes)
let defaultEndpointFactories: Record<string, Record<string, EndpointFactory>>;

// Constant used to detect first-party WordPress REST API routes
const apiDefaultNamespace = 'wp/v2';

/**
 * The options hash a WPAPI instance is constructed with.
 */
interface WPAPIOptions {
	endpoint: string;
	username?: string;
	password?: string;
	nonce?: string;
	routes?: Record<string, RouteDefinition>;
	transport?: Partial<HTTPTransport>;
}

/**
 * A namespace's dictionary of route endpoint handler factories, as assigned
 * onto a WPAPI instance's `_ns` property by `.bootstrap()`. `_options` is a
 * direct reference to the owning WPAPI instance's `_options`, so that things
 * like auth propagate properly to handlers created via `.namespace( str )`.
 * The dynamically-named handler factory methods (`.posts`, `.pages`, etc)
 * are the dynamic route-handler surface described in lib/types.ts, hence
 * the `any` index signature.
 */
interface NamespaceHandlers {
	_options: WPRequestOptions;
	[ methodName: string ]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * WPAPI is a REST API client instance object, configured to interact with a
 * specific WordPress site
 */
// The `auth`/`setHeaders`/`registerRoute` methods declared via the merged
// `interface WPAPI` below are aliased from WPRequest.prototype (or from
// lib/wp-register-route) after the class, rather than implemented as class
// members; the merge only adds their signatures, which is safe because none
// of them shadow a real class member with an incompatible type.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class WPAPI {

	/**
	 * Dictionary of endpoint handler factories, keyed by namespace
	 *
	 * @property _ns
	 * @type {object}
	 * @private
	 */
	_ns: Record<string, NamespaceHandlers>;

	/**
	 * Configuration options for this instance
	 *
	 * @property _options
	 * @type {object}
	 * @private
	 */
	_options: WPRequestOptions;

	/**
	 * The default HTTP transport methods to use for instances of this
	 * constructor, if no instance-specific transport was provided. Set by
	 * lib/bind-transport.ts on the transport-specific constructors this
	 * library exports; the base WPAPI class itself has no default.
	 *
	 * @property transport
	 * @type {object}
	 * @static
	 */
	static transport?: HTTPTransport;

	// Dynamically-attached route handler factories (`.posts`, `.pages`, etc),
	// assigned by `.bootstrap()` for the default (wp/v2) namespace: this is
	// the dynamic route-handler surface described in lib/types.ts.
	[ routeHandler: string ]: any; // eslint-disable-line @typescript-eslint/no-explicit-any

	/**
	 * @param options             An options hash to configure the instance
	 * @param options.endpoint    The URI for a WP-API endpoint
	 * @param [options.username]  A WP-API Basic Auth username
	 * @param [options.password]  A WP-API Basic Auth password
	 * @param [options.nonce]     A WP nonce for use with cookie authentication
	 * @param [options.routes]    A dictionary of API routes with which to
	 *                            bootstrap the WPAPI instance: the instance will
	 *                            be initialized with default routes only
	 *                            if this property is omitted
	 * @param [options.transport] An optional dictionary of HTTP transport
	 *                            methods (.get, .post, .put, .delete, .head)
	 *                            to use instead of the defaults, e.g. to use
	 *                            a different HTTP library than native fetch
	 */
	constructor( options: WPAPIOptions ) {
		if ( typeof options.endpoint !== 'string' ) {
			throw new Error( 'options hash must contain an API endpoint URL string' );
		}

		// Dictionary to be filled by handlers for default namespaces
		this._ns = {};

		this._options = {
			// Ensure trailing slash on endpoint URI
			endpoint: options.endpoint.replace( /\/?$/, '/' ),
		} as WPRequestOptions;

		// If any authentication credentials were provided, assign them now
		if ( options && ( options.username || options.password || options.nonce ) ) {
			this.auth( options );
		}

		return this
			// Configure custom HTTP transport methods, if provided
			.transport( options.transport )
			// Bootstrap with a specific routes object, if provided
			.bootstrap( options && options.routes );
	}

	/**
	 * Set custom transport methods to use when making HTTP requests against the API
	 *
	 * Pass an object with a function for one or many of "get", "post", "put",
	 * "delete" and "head" and that function will be called when making that type
	 * of request. The provided transport functions should take a WPRequest handler
	 * instance (_e.g._ the result of a `wp.posts()...` chain or any other chaining
	 * request handler) as their first argument; a `data` object as their second
	 * argument (for POST, PUT and DELETE requests); and an optional callback as
	 * their final argument. Transport methods should invoke the callback with the
	 * response data (or error, as appropriate), and should also return a Promise.
	 *
	 * @example <caption>showing how a cache hit (keyed by URI) could short-circuit a get request</caption>
	 *
	 *     var site = new WPAPI({
	 *       endpoint: 'http://my-site.com/wp-json'
	 *     });
	 *
	 *     // Overwrite the GET behavior to inject a caching layer
	 *     site.transport({
	 *       get: function( wpreq ) {
	 *         var result = cache[ wpreq ];
	 *         // If a cache hit is found, return it via the same promise
	 *         // signature as that of the default transport method
	 *         if ( result ) {
	 *           return Promise.resolve( result );
	 *         }
	 *
	 *         // Delegate to default transport if no cached data was found
	 *         return this.constructor.transport.get( wpreq ).then(function( result ) {
	 *           cache[ wpreq ] = result;
	 *           return result;
	 *         });
	 *       }
	 *     });
	 *
	 * This is advanced behavior; you will only need to utilize this functionality
	 * if your application has very specific HTTP handling or caching requirements.
	 * Refer to the "http-transport" module within this application for the code
	 * implementing the built-in transport methods.
	 *
	 * @memberof! WPAPI
	 * @method transport
	 * @chainable
	 * @param transport          A dictionary of HTTP transport methods
	 * @param [transport.get]    The function to use for GET requests
	 * @param [transport.post]   The function to use for POST requests
	 * @param [transport.put]    The function to use for PUT requests
	 * @param [transport.delete] The function to use for DELETE requests
	 * @param [transport.head]   The function to use for HEAD requests
	 * @returns The WPAPI instance, for chaining
	 */
	transport( transport?: Partial<HTTPTransport> ): this {
		// Local reference to avoid need to reference via `this` inside forEach
		const _options = this._options;

		// Attempt to use the default transport if no override was provided
		if ( ! _options.transport ) {
			// `this.constructor` is typed as the generic `Function` interface,
			// which does not carry WPAPI's own static `transport` property (set,
			// for a transport-bound constructor, by lib/bind-transport.ts); cast
			// to access it.
			const defaultTransport = ( this.constructor as typeof WPAPI ).transport;
			_options.transport = defaultTransport ?
				Object.create( defaultTransport ) :
				{} as HTTPTransport;
		}

		// Whitelist the methods that may be applied
		( [ 'get', 'head', 'post', 'put', 'delete' ] as const ).forEach( ( key ) => {
			if ( transport && transport[ key ] ) {
				_options.transport[ key ] = transport[ key ];
			}
		} );

		return this;
	}

	/**
	 * Generate a request against a completely arbitrary endpoint, with no assumptions about
	 * or mutation of path, filtering, or query parameters. This request is not restricted to
	 * the endpoint specified during WPAPI object instantiation.
	 *
	 * @example
	 * Generate a request to the explicit URL "http://your.website.com/wp-json/some/custom/path"
	 *
	 *     wp.url( 'http://your.website.com/wp-json/some/custom/path' ).get()...
	 *
	 * @memberof! WPAPI
	 * @param url The URL to request
	 * @returns A WPRequest object bound to the provided URL
	 */
	url( url: string ): WPRequest {
		return new WPRequest( {
			...this._options,
			endpoint: url,
		} );
	}

	/**
	 * Generate a query against an arbitrary path on the current endpoint. This is useful for
	 * requesting resources at custom WP-API endpoints, such as WooCommerce's `/products`.
	 *
	 * @memberof! WPAPI
	 * @param [relativePath] An endpoint-relative path to which to bind the request
	 * @returns A request object
	 */
	root( relativePath?: string ): WPRequest {
		relativePath = relativePath || '';
		const options = {
			...this._options,
		};
		// Request should be
		const request = new WPRequest( options );

		// Set the path template to the string passed in
		request._path = { '0': relativePath };

		return request;
	}

	/**
	 * Deduce request methods from a provided API root JSON response object's
	 * routes dictionary, and assign those methods to the current instance. If
	 * no routes dictionary is provided then the instance will be bootstrapped
	 * with route handlers for the default API endpoints only.
	 *
	 * This method is called automatically during WPAPI instance creation.
	 *
	 * @memberof! WPAPI
	 * @chainable
	 * @param routes The "routes" object from the JSON object returned
	 *               from the root API endpoint of a WP site, which should
	 *               be a dictionary of route definition objects keyed by
	 *               the route's regex pattern
	 * @returns The bootstrapped WPAPI client instance (for chaining or assignment)
	 */
	bootstrap( routes?: Record<string, RouteDefinition> ): this {
		let routesByNamespace: RouteTree;
		let endpointFactoriesByNamespace: Record<string, Record<string, EndpointFactory>>;

		if ( ! routes ) {
			// Auto-generate default endpoint factories if they are not already
			// available. The default route tree is pre-parsed at build time, so no
			// route parsing happens here; only custom routes (below) are parsed at
			// runtime. (Double-cast: the JSON module's inferred literal type cannot
			// be checked against RouteTree's index-signature intersection directly.)
			if ( ! defaultEndpointFactories ) {
				defaultEndpointFactories = generateEndpointFactories(
					defaultRouteTree as unknown as RouteTree,
				);
			}
			endpointFactoriesByNamespace = defaultEndpointFactories;
		} else {
			routesByNamespace = buildRouteTree( routes );
			endpointFactoriesByNamespace = generateEndpointFactories( routesByNamespace );
		}

		// For each namespace for which routes were identified, store the generated
		// route handlers on the WPAPI instance's private _ns dictionary. These namespaced
		// handler methods can be accessed by calling `.namespace( str )` on the
		// client instance and passing a registered namespace string.
		// Handlers for default (wp/v2) routes will also be assigned to the WPAPI
		// client instance object itself, for brevity.
		return objectReduce( endpointFactoriesByNamespace, ( wpInstance, endpointFactories, namespace ) => {

			// Set (or augment) the route handler factories for this namespace.
			wpInstance._ns[ namespace ] = objectReduce(
				endpointFactories,
				( nsHandlers, handlerFn, methodName ) => {
					nsHandlers[ methodName ] = handlerFn;
					return nsHandlers;
				},
				wpInstance._ns[ namespace ] || {
					// Create all namespace dictionaries with a direct reference to the main WPAPI
					// instance's _options property so that things like auth propagate properly
					_options: wpInstance._options,
				},
			);

			// For the default namespace, e.g. "wp/v2" at the time this comment was
			// written, ensure all methods are assigned to the root client object itself
			// in addition to the private _ns dictionary: this is done so that these
			// methods can be called with e.g. `wp.posts()` and not the more verbose
			// `wp.namespace( 'wp/v2' ).posts()`.
			if ( namespace === apiDefaultNamespace ) {
				Object.keys( wpInstance._ns[ namespace ] ).forEach( ( methodName ) => {
					wpInstance[ methodName ] = wpInstance._ns[ namespace ][ methodName ];
				} );
			}

			return wpInstance;
		}, this );
	}

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
	 * @memberof! WPAPI
	 * @param namespace A namespace string
	 * @returns An object of route endpoint handler methods for the
	 * routes within the specified namespace
	 */
	namespace( namespace: string ): NamespaceHandlers {
		if ( ! this._ns[ namespace ] ) {
			throw new Error( 'Error: namespace ' + namespace + ' is not recognized' );
		}
		return this._ns[ namespace ];
	}

	/**
	 * Convenience method for making a new WPAPI instance for a given API root
	 *
	 * @example
	 * These are equivalent:
	 *
	 *     var wp = new WPAPI({ endpoint: 'http://my.blog.url/wp-json' });
	 *     var wp = WPAPI.site( 'http://my.blog.url/wp-json' );
	 *
	 * `WPAPI.site` can take an optional API root response JSON object to use when
	 * bootstrapping the client's endpoint handler methods: if no second parameter
	 * is provided, the client instance is assumed to be using the default API
	 * with no additional plugins and is initialized with handlers for only those
	 * default API routes.
	 *
	 * @example
	 * These are equivalent:
	 *
	 *     // {...} means the JSON output of http://my.blog.url/wp-json
	 *     var wp = new WPAPI({
	 *       endpoint: 'http://my.blog.url/wp-json',
	 *       json: {...}
	 *     });
	 *     var wp = WPAPI.site( 'http://my.blog.url/wp-json', {...} );
	 *
	 * @memberof! WPAPI
	 * @static
	 * @param endpoint The URI for a WP-API endpoint
	 * @param routes   The "routes" object from the JSON object returned
	 *                 from the root API endpoint of a WP site, which should
	 *                 be a dictionary of route definition objects keyed by
	 *                 the route's regex pattern
	 * @returns A new WPAPI instance, bound to the provided endpoint
	 */
	static site( endpoint: string, routes?: Record<string, RouteDefinition> ): WPAPI {
		return new WPAPI( {
			endpoint: endpoint,
			routes: routes,
		} );
	}

}

// Globally-applicable methods aliased from elsewhere, rather than implemented as class
// members: their signatures are declared here via declaration merging.
// ===============================================================================================

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface WPAPI {

	/**
	 * Set the authentication to use for a WPAPI site handler instance. Accepts basic
	 * HTTP authentication credentials (string username & password) or a Nonce (for
	 * cookie authentication) by default; may be overloaded to accept OAuth credentials
	 * in the future.
	 *
	 * @example <caption>Basic Authentication</caption>
	 *
	 *     site.auth({
	 *       username: 'admin',
	 *       password: 'securepass55'
	 *     })...
	 *
	 * @example <caption>Cookie/Nonce Authentication</caption>
	 *
	 *     site.auth({
	 *       nonce: 'somenonce'
	 *     })...
	 *
	 * @memberof! WPAPI
	 * @method
	 * @chainable
	 * @param credentials            An authentication credentials object
	 * @param [credentials.username] A WP-API Basic HTTP Authentication username
	 * @param [credentials.password] A WP-API Basic HTTP Authentication password
	 * @param [credentials.nonce]    A WP nonce for use with cookie authentication
	 * @returns The WPAPI site handler instance, for chaining
	 */
	auth( credentials?: { username?: string; password?: string; nonce?: string } ): this;

	/**
	 * Set the default headers to use for all HTTP requests created from this WPAPI
	 * site instance. Accepts a header name and its associated value as two strings,
	 * or multiple headers as an object of name-value pairs.
	 *
	 * @example <caption>Set a single header to be used by all requests to this site</caption>
	 *
	 *     site.setHeaders( 'Authorization', 'Bearer trustme' )...
	 *
	 * @example <caption>Set multiple headers to be used by all requests to this site</caption>
	 *
	 *     site.setHeaders({
	 *       Authorization: 'Bearer comeonwereoldfriendsright',
	 *       'Accept-Language': 'en-CA'
	 *     })...
	 *
	 * @memberof! WPAPI
	 * @since 1.1.0
	 * @chainable
	 * @param headers The name of the header to set, or an object of
	 *                header names and their associated string values
	 * @param [value] The value of the header being set
	 * @returns The WPAPI site handler instance, for chaining
	 */
	setHeaders( headers?: string | Record<string, string>, value?: string ): this;

	/**
	 * Create and return a handler for an arbitrary WP REST API endpoint. See
	 * lib/wp-register-route.ts for full documentation.
	 *
	 * @memberof! WPAPI#
	 */
	registerRoute: typeof registerRoute;

}

WPAPI.prototype.auth = WPRequest.prototype.auth as unknown as WPAPI[ 'auth' ];
WPAPI.prototype.setHeaders = WPRequest.prototype.setHeaders as unknown as WPAPI[ 'setHeaders' ];

// Apply the registerRoute method to the prototype
WPAPI.prototype.registerRoute = registerRoute;

export = WPAPI;
