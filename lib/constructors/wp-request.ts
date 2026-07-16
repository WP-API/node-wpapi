type WPRequestOptions = import( '../types' ).WPRequestOptions;
type LevelOption = import( '../types' ).LevelOption;

/**
 * @module constructors/wp-request
 */

import qs = require( 'qs' );

import alphaNumericSort = require( '../util/alphanumeric-sort' );
import keyValToObj = require( '../util/key-val-to-obj' );
import paramSetter = require( '../util/parameter-setter' );
import objectReduce = require( '../util/object-reduce' );
import unique = require( '../util/unique' );

// Private helper methods
// ======================

/**
 * Identity function for use within invokeAndPromisify()
 * @private
 */
const identity = ( value: unknown ): unknown => value;

/**
 * Process arrays of taxonomy terms into query parameters.
 * All terms listed in the arrays will be required (AND behavior).
 *
 * This method will not be called with any values unless we are handling
 * an endpoint with the filter mixin; however, since parameter handling
 * (and therefore `_renderQuery()`) are part of WPRequest itself, this
 * helper method lives here alongside the code where it is used.
 *
 * @example
 *     prepareTaxonomies({
 *         tag: [ 'tag1 ', 'tag2' ], // by term slug
 *         cat: [ 7 ] // by term ID
 *     }) === {
 *         tag: 'tag1+tag2',
 *         cat: '7'
 *     }
 *
 * @private
 * @param taxonomyFilters An object of taxonomy term arrays, keyed by taxonomy name
 * @returns An object of prepareFilters-ready query arg and query param value pairs
 */
function prepareTaxonomies( taxonomyFilters?: Record<string, Array<string | number>> ): Record<string, string> {
	if ( ! taxonomyFilters ) {
		return {};
	}

	return objectReduce(
		taxonomyFilters,
		( result, terms, key ) => {
			// Trim whitespace and concatenate multiple terms with +
			result[ key ] = terms
				// Coerce term into a string so that trim() won't fail
				.map( term => ( term + '' ).trim().toLowerCase() )
				.join( '+' );

			return result;
		},
		{} as Record<string, string>,
	);
}

/**
 * Return an object with any properties with undefined, null or empty string
 * values removed.
 *
 * @example
 *
 *     populated({
 *       a: 'a',
 *       b: '',
 *       c: null
 *     }); // { a: 'a' }
 *
 * @private
 * @param obj An object of key/value pairs
 * @returns That object with all empty values removed
 */
const populated = ( obj?: Record<string, unknown> ): Record<string, unknown> | undefined => {
	if ( ! obj ) {
		return obj;
	}
	return objectReduce(
		obj,
		( values, val, key ) => {
			if ( val !== undefined && val !== null && val !== '' ) {
				values[ key ] = val;
			}
			return values;
		},
		{} as Record<string, unknown>,
	);
};

/**
 * Assert whether a provided URL component is "valid" by checking it against
 * an array of registered path component validator methods for that level of
 * the URL path.
 *
 * @private
 * @param levelDefinitions An array of Level Definition objects
 * @param levelContents    The URL path string that has been specified
 *                         for use on the provided level
 */
const validatePathLevel = ( levelDefinitions: LevelOption[], levelContents: string | number ): void => {
	// One "level" may have multiple options, as a route tree is a branching
	// structure. We consider a level "valid" if the provided levelContents
	// match any of the available validators.
	const valid = levelDefinitions.reduce( ( anyOptionValid, levelOption ) => {
		if ( ! levelOption.validate ) {
			// If there is no validator function, the level is implicitly valid
			return true;
		}
		// levelContents may be a number (e.g. a numeric ID); validators are typed
		// to accept only strings, but RegExp#test coerces its argument to a
		// string internally at runtime regardless, so the cast is safe here.
		return anyOptionValid || levelOption.validate( levelContents as string );
	}, false );

	if ( ! valid ) {
		throw new Error( [
			'Invalid path component:',
			levelContents,
			// awkward pluralization support:
			'does not match' + ( levelDefinitions.length > 1 ? ' any of' : '' ),
			levelDefinitions.reduce(
				( components, levelOption ) => components.concat( levelOption.component ),
				[] as string[],
			).join( ', ' ),
		].join( ' ' ) );
	}
};

/**
 * WPRequest is the base API request object
 */
// The paramSetter()-assigned methods declared via the merged `interface WPRequest` below
// (context, page, perPage, etc) are intentionally not implemented as class members; the
// merge only adds their signatures, which is safe because none of them shadow a real
// class member with an incompatible type.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class WPRequest {

	/**
	 * Configuration options for the request
	 *
	 * @property _options
	 * @type {object}
	 * @private
	 */
	_options: WPRequestOptions;

	/**
	 * The HTTP transport methods (.get, .post, .put, .delete, .head) to use for this request
	 *
	 * @property transport
	 * @type {object}
	 * @private
	 */
	transport: WPRequestOptions[ 'transport' ];

	/**
	 * A hash of query parameters
	 * This is used to store the values for supported query parameters like ?_embed
	 *
	 * @property _params
	 * @type {object}
	 * @private
	 */
	_params: Record<string, unknown>;

	/**
	 * Methods supported by this API request instance:
	 * Individual endpoint handlers specify their own subset of supported methods
	 *
	 * @property _supportedMethods
	 * @type {Array}
	 * @private
	 */
	_supportedMethods: string[];

	/**
	 * A hash of values to assemble into the API request path
	 * (This will be overwritten by each specific endpoint handler constructor)
	 *
	 * @property _path
	 * @type {object}
	 * @private
	 */
	_path: Record<string, string | number>;

	/**
	 * The namespace of the request, e.g. "wp/v2"; set via .namespace().
	 *
	 * @property _namespace
	 * @type {string}
	 * @private
	 */
	_namespace?: string;

	/**
	 * The available URL path options for this endpoint request handler, keyed
	 * by ascending whole numbers; set by the endpoint-specific request
	 * constructor.
	 *
	 * @property _levels
	 * @type {object}
	 * @private
	 */
	_levels?: Record<number, LevelOption[]>;

	/**
	 * Filter values set via the filter mixin's .filter() method.
	 *
	 * @property _filters
	 * @type {object}
	 * @private
	 */
	_filters?: Record<string, unknown>;

	/**
	 * Taxonomy term filter values set via the filter mixin's .taxonomy() method.
	 *
	 * @property _taxonomyFilters
	 * @type {object}
	 * @private
	 */
	_taxonomyFilters?: Record<string, Array<string | number>>;

	/**
	 * A file to attach to the request, set via .file().
	 *
	 * @property _attachment
	 * @type {string|Buffer|Blob|File}
	 * @private
	 */
	_attachment?: string | Buffer | Blob | File;

	/**
	 * The filename to use for ._attachment, set via .file().
	 *
	 * @property _attachmentName
	 * @type {string}
	 * @private
	 */
	_attachmentName?: string;

	/**
	 * @param options A hash of options for the WPRequest instance
	 * @param options.endpoint The endpoint URI for the invoking WPAPI instance
	 * @param options.transport An object of http transport methods (get, post, etc)
	 * @param [options.username] A username for authenticating API requests
	 * @param [options.password] A password for authenticating API requests
	 * @param [options.nonce] A WP nonce for use with cookie authentication
	 */
	constructor( options: WPRequestOptions ) {
		this._options = ( [
			// Whitelisted options keys
			'auth',
			'endpoint',
			'headers',
			'username',
			'password',
			'nonce',
		] as const ).reduce( ( localOptions, key ) => {
			if ( options && options[ key ] ) {
				localOptions[ key ] = options[ key ] as never;
			}
			return localOptions;
		}, {} as WPRequestOptions );

		this.transport = options && options.transport;

		this._params = {};

		this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

		this._path = {};
	}

	// (Semi-)Private Prototype Methods
	// ================================

	/**
	 * Process the endpoint query's filter objects into a valid query string.
	 * Nested objects and Array properties are rendered with indexed array syntax.
	 *
	 * @example
	 *     _renderQuery({ p1: 'val1', p2: 'val2' });  // ?p1=val1&p2=val2
	 *     _renderQuery({ obj: { prop: 'val' } });    // ?obj[prop]=val
	 *     _renderQuery({ arr: [ 'val1', 'val2' ] }); // ?arr[0]=val1&arr[1]=val2
	 *
	 * @private
	 *
	 * @method _renderQuery
	 * @returns A query string representing the specified filter parameters
	 */
	_renderQuery(): string {
		// Build the full query parameters object
		const queryParams: Record<string, unknown> = {
			...populated( this._params ),
		};

		// Prepare any taxonomies and merge with other filter values
		const taxonomies = prepareTaxonomies( this._taxonomyFilters );
		queryParams.filter = {
			...populated( this._filters ),
			...taxonomies,
		};

		// Parse query parameters object into a query string, sorting the object
		// properties by alphabetical order (consistent property ordering can make
		// for easier caching of request URIs)
		const queryString = qs.stringify( queryParams, { arrayFormat: 'brackets' } )
			.split( '&' )
			.sort()
			.join( '&' );

		// Check if the endpoint contains a previous query and set the query character accordingly.
		const queryCharacter = /\?/.test( this._options.endpoint ) ? '&' : '?';

		// Prepend a "?" (or a "&") if a query is present, and return.
		return ( queryString === '' ) ? '' : queryCharacter + queryString;
	}

	/**
	 * Validate & assemble a path string from the request object's _path
	 *
	 * @private
	 * @returns The rendered path
	 */
	_renderPath(): string {
		// Call validatePath: if the provided path components are not well-formed,
		// an error will be thrown
		this.validatePath();

		const pathParts = this._path;
		const orderedPathParts = Object.keys( pathParts )
			.sort( ( a, b ) => {
				const intA = parseInt( a, 10 );
				const intB = parseInt( b, 10 );
				return intA - intB;
			} )
			.map( pathPartKey => pathParts[ pathPartKey ] );

		// Combine all parts of the path together, filtered to omit any components
		// that are unspecified or empty strings, to create the full path template
		const path = ( [
			this._namespace,
		] as Array<string | number | undefined> ).concat( orderedPathParts ).filter( identity ).join( '/' );

		return path;
	}

	// Public Prototype Methods
	// ========================

	/**
	 * Parse the request into a WordPress API request URI string
	 *
	 * @method
	 * @returns The URI for the HTTP request to be sent
	 */
	toString(): string {
		// Render the path to a string
		const path = this._renderPath();

		// Render the query string
		const queryStr = this._renderQuery();

		return this._options.endpoint + path + queryStr;
	}

	/**
	 * Set a component of the resource URL itself (as opposed to a query parameter)
	 *
	 * If a path component has already been set at this level, throw an error:
	 * requests are meant to be transient, so any re-writing of a previously-set
	 * path part value is likely to be a mistake.
	 *
	 * @method
	 * @chainable
	 * @param level A "level" of the path to set, e.g. "1" or "2"
	 * @param val   The value to set at that path part level
	 * @returns The WPRequest instance (for chaining)
	 */
	setPathPart( level: number, val: string | number ): this {
		if ( this._path[ level ] ) {
			throw new Error( 'Cannot overwrite value ' + this._path[ level ] );
		}
		this._path[ level ] = val;

		return this;
	}

	/**
	 * Validate whether the specified path parts are valid for this endpoint
	 *
	 * "Path parts" are non-query-string URL segments, like "some" "path" in the URL
	 * `mydomain.com/some/path?and=a&query=string&too`. Because a well-formed path
	 * is necessary to execute a successful API request, we throw an error if the
	 * user has omitted a value (such as `/some/[missing component]/url`) or has
	 * provided a path part value that does not match the regular expression the
	 * API uses to goven that segment.
	 *
	 * @method
	 * @chainable
	 * @returns The WPRequest instance (for chaining), if no errors were found
	 */
	validatePath(): this {
		// Iterate through all _specified_ levels of this endpoint
		const specifiedLevels = Object.keys( this._path )
			.map( level => parseInt( level, 10 ) )
			.filter( pathPartKey => ! isNaN( pathPartKey ) );

		const maxLevel = Math.max.apply( null, specifiedLevels );

		// Ensure that all necessary levels are specified
		const path: Array<string | number> = [];
		let valid = true;

		for ( let level = 0; level <= maxLevel; level++ ) {

			if ( ! this._levels || ! this._levels[ level ] ) {
				continue;
			}

			if ( this._path[ level ] ) {
				// Validate the provided path level against all available path validators
				validatePathLevel( this._levels[ level ], this._path[ level ] );

				// Add the path value to the array
				path.push( this._path[ level ] );
			} else {
				path.push( ' ??? ' );
				valid = false;
			}
		}

		if ( ! valid ) {
			throw new Error( 'Incomplete URL! Missing component: /' + path.join( '/' ) );
		}

		return this;
	}

	/**
	 * Set a parameter to render into the final query URI.
	 *
	 * @method
	 * @chainable
	 * @param props The name of the parameter to set, or an object containing
	 *              parameter keys and their corresponding values
	 * @param [value] The value of the parameter being set
	 * @returns The WPRequest instance (for chaining)
	 */
	param( props?: string | Record<string, unknown>, value?: unknown ): this {
		if ( ! props || typeof props === 'string' && value === undefined ) {
			// We have no property to set, or no value to set for that property
			return this;
		}

		// We can use the same iterator function below to handle explicit key-value
		// pairs if we convert them into to an object we can iterate over:
		if ( typeof props === 'string' ) {
			props = keyValToObj( props, value );
		}

		// Iterate through the properties
		Object.keys( props ).forEach( ( key ) => {
			let value = props[ key ];

			// Arrays should be de-duped and sorted
			if ( Array.isArray( value ) ) {
				value = unique( value as Array<string | number> ).sort( alphaNumericSort );
			}

			// Set the value
			this._params[ key ] = value;
		} );

		return this;
	}

	/**
	 * Convenience wrapper for `.context( 'edit' )`
	 *
	 * @method
	 * @chainable
	 * @returns The WPRequest instance (for chaining)
	 */
	edit(): this {
		return this.context( 'edit' );
	}

	/**
	 * Return embedded resources as part of the response payload.
	 *
	 * @method
	 * @chainable
	 * @returns The WPRequest instance (for chaining)
	 */
	embed(): this {
		return this.param( '_embed', true );
	}

	// HTTP Transport Prototype Methods
	// ================================

	// Chaining methods
	// ================

	/**
	 * Set the namespace of the request, e.g. to specify the API root for routes
	 * registered by wp core v2 ("wp/v2") or by any given plugin. Any previously-
	 * set namespace will be overwritten by subsequent calls to the method.
	 *
	 * @method
	 * @chainable
	 * @param namespace A namespace string, e.g. "wp/v2"
	 * @returns The WPRequest instance (for chaining)
	 */
	namespace( namespace: string ): this {
		this._namespace = namespace;
		return this;
	}

	/**
	 * Set a request to use authentication, and optionally provide auth credentials
	 *
	 * If auth credentials were already specified when the WPAPI instance was created, calling
	 * `.auth` on the request chain will set that request to use the existing credentials:
	 *
	 * @example <caption>use existing credentials</caption>
	 *
	 *     request.auth().get...
	 *
	 * Alternatively, a username & password (or nonce) can be explicitly passed into `.auth`:
	 *
	 * @example <caption>use explicit basic authentication credentials</caption>
	 *
	 *     request.auth({
	 *       username: 'admin',
	 *       password: 'super secure'
	 *     }).get...
	 *
	 * @example <caption>use a nonce for cookie authentication</caption>
	 *
	 *     request.auth({
	 *       nonce: 'somenonce'
	 *     })...
	 *
	 * @method
	 * @chainable
	 * @param credentials            An object with 'username' and 'password' string
	 *                               properties, or else a 'nonce' property
	 * @param [credentials.username] A WP-API Basic HTTP Authentication username
	 * @param [credentials.password] A WP-API Basic HTTP Authentication password
	 * @param [credentials.nonce]    A WP nonce for use with cookie authentication
	 * @returns The WPRequest instance (for chaining)
	 */
	auth( credentials?: { username?: string; password?: string; nonce?: string } ): this {
		if ( typeof credentials === 'object' ) {
			if ( typeof credentials.username === 'string' ) {
				this._options.username = credentials.username;
			}

			if ( typeof credentials.password === 'string' ) {
				this._options.password = credentials.password;
			}

			if ( credentials.nonce ) {
				this._options.nonce = credentials.nonce;
			}
		}

		// Set the "auth" options flag that will force authentication on this request
		this._options.auth = true;

		return this;
	}

	/**
	 * Specify a file to attach to the request, for use when creating a new Media item
	 *
	 * @example <caption>within a server context</caption>
	 *
	 *     wp.media()
	 *       // Pass .file() the file system path to a file to upload
	 *       .file( '/path/to/file.jpg' )
	 *       .create({})...
	 *
	 *     wp.media()
	 *       // Pass .file() an image as a Buffer or Blob object, and a filename string
	 *       .file( imgBuffer, 'desired-title.jpg' )
	 *       .create({})...
	 *
	 * @example <caption>within a browser context</caption>
	 *
	 *     wp.media()
	 *       // Pass .file() the file reference from an HTML file input
	 *       .file( document.querySelector( 'input[type="file"]' ).files[0] )
	 *       .create({})...
	 *
	 * @method
	 * @chainable
	 * @param file  A path to a file (in Node), or the file data as a Buffer,
	 *              Blob or File object
	 * @param [name] A filename (with extension) to use for the file; required
	 *               unless the file is a path or File object
	 * @returns The WPRequest instance (for chaining)
	 */
	file( file?: string | Buffer | Blob | File, name?: string ): this {
		if ( file ) {
			const isBuffer = globalThis.Buffer && file instanceof globalThis.Buffer;
			const isBlob = typeof Blob !== 'undefined' && file instanceof Blob;
			if ( typeof file !== 'string' && ! isBuffer && ! isBlob ) {
				throw new TypeError(
					'.file(): file must be a file path, Buffer, Blob or File object. ' +
					'(Streams are no longer supported as of wpapi 2.0.0.)',
				);
			}
			// Uploads need a file name with an extension for WordPress to accept them, and
			// raw data objects carry none of their own; require one rather than fail obscurely.
			// A Blob is checked for a name property rather than a File instanceof so that any
			// Blob-like object carrying its own name is accepted, File instances included.
			// (Blob's type has no `.name`, hence the cast for the duck-type test.)
			if ( ! name && ( isBuffer || ( isBlob && typeof ( file as { name?: unknown } ).name !== 'string' ) ) ) {
				throw new Error( '.file(): File name is a required argument when uploading a Buffer or Blob' );
			}
		}
		this._attachment = file;
		// Explicitly set to undefined if not provided, to override any previously-
		// set attachment name property that might exist from a prior `.file()` call
		this._attachmentName = name ? name : undefined;
		return this;
	}

	// HTTP Methods: Public Interface
	// ==============================

	/**
	 * Specify one or more headers to send with the dispatched HTTP request.
	 *
	 * @example <caption>Set a single header to be used on this request</caption>
	 *
	 *     request.setHeaders( 'Authorization', 'Bearer trustme' )...
	 *
	 * @example <caption>Set multiple headers to be used by this request</caption>
	 *
	 *     request.setHeaders({
	 *       Authorization: 'Bearer comeonwereoldfriendsright',
	 *       'Accept-Language': 'en-CA'
	 *     })...
	 *
	 * @since 1.1.0
	 * @method
	 * @chainable
	 * @param headers The name of the header to set, or an object of
	 *                header names and their associated string values
	 * @param [value] The value of the header being set
	 * @returns The WPRequest instance (for chaining)
	 */
	setHeaders( headers?: string | Record<string, string>, value?: string ): this {
		// We can use the same iterator function below to handle explicit key-value
		// pairs if we convert them into to an object we can iterate over:
		if ( typeof headers === 'string' ) {
			headers = keyValToObj( headers, value as string );
		}

		this._options.headers = {
			...( this._options.headers || {} ),
			...headers,
		};

		return this;
	}

	/**
	 * Get (download the data for) the specified resource
	 *
	 * @method
	 * @async
	 * @returns A promise to the results of the HTTP request
	 */
	get() {
		return this.transport.get( this );
	}

	/**
	 * Get the headers for the specified resource
	 *
	 * @method
	 * @async
	 * @returns A promise to the header results of the HTTP request
	 */
	headers() {
		return this.transport.head( this );
	}

	/**
	 * Create the specified resource with the provided data
	 *
	 * This is the public interface for creating POST requests
	 *
	 * @method
	 * @async
	 * @param data The data for the POST request
	 * @returns A promise to the results of the HTTP request
	 */
	create( data: unknown ) {
		return this.transport.post( this, data );
	}

	/**
	 * Update the specified resource with the provided data
	 *
	 * This is the public interface for creating PUT requests
	 *
	 * @method
	 * @async
	 * @private
	 * @param data The data for the PUT request
	 * @returns A promise to the results of the HTTP request
	 */
	update( data: unknown ) {
		return this.transport.put( this, data );
	}

	/**
	 * Delete the specified resource
	 *
	 * @method
	 * @async
	 * @param [data] Data to send along with the DELETE request
	 * @returns A promise to the results of the HTTP request
	 */
	delete( data?: unknown ) {
		return this.transport.delete( this, data );
	}

	/**
	 * Calling .then on a query chain will invoke the query as a GET and return a promise
	 *
	 * @method
	 * @async
	 * @param [successCallback] A callback to handle the data returned from the GET request
	 * @param [failureCallback] A callback to handle any errors encountered by the request
	 * @returns A promise to the results of the HTTP request
	 */
	/* eslint-disable @typescript-eslint/no-explicit-any -- mirrors PromiseLike's own (loose)
	 * typing, so that `await wp.posts()` etc keep a useful, non-`unknown` resolved type for
	 * consumers, the same way awaiting a real Promise does. */
	then<T1 = any, T2 = never>(
		successCallback?: ( value: any ) => T1 | PromiseLike<T1>,
		failureCallback?: ( reason: any ) => T2 | PromiseLike<T2>,
	): Promise<T1 | T2> {
		return this.transport.get( this ).then( successCallback, failureCallback );
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */

}

// Globally-applicable parameters that impact the shape of the request or response, and
// parameters supported by all/nearly all default collections: these are all implemented
// via the same generic paramSetter() helper, so their prototype methods are assigned
// below rather than declared as class methods; their signatures are declared here via
// declaration merging.
// =======================================================================================

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface WPRequest {

	/**
	 * Set the context of the request. Used primarily to expose private values on a
	 * request object by setting the context to "edit".
	 *
	 * @method
	 * @chainable
	 * @param context The context to set on the request
	 * @returns The WPRequest instance (for chaining)
	 */
	context( context: string ): this;

	/**
	 * Set the pagination of a request. Use in conjunction with `.perPage()` for explicit
	 * pagination handling. (The number of pages in a response can be retrieved from the
	 * response's `_paging.totalPages` property.)
	 *
	 * @method
	 * @chainable
	 * @param pageNumber The page number of results to retrieve
	 * @returns The request instance (for chaining)
	 */
	page( pageNumber: number ): this;

	/**
	 * Set the number of items to be returned in a page of responses.
	 *
	 * @method
	 * @chainable
	 * @param itemsPerPage The number of items to return in one page of results
	 * @returns The request instance (for chaining)
	 */
	perPage( itemsPerPage: number ): this;

	/**
	 * Set an arbitrary offset to retrieve items from a specific point in a collection.
	 *
	 * @method
	 * @chainable
	 * @param offsetNumber The number of items by which to offset the response
	 * @returns The request instance (for chaining)
	 */
	offset( offsetNumber: number ): this;

	/**
	 * Change the sort direction of a returned collection
	 *
	 * @example <caption>order comments chronologically (oldest first)</caption>
	 *
	 *     site.comments().order( 'asc' )...
	 *
	 * @method
	 * @chainable
	 * @param direction The order to use when sorting the response
	 * @returns The request instance (for chaining)
	 */
	order( direction: string ): this;

	/**
	 * Order a collection by a specific field
	 *
	 * @method
	 * @chainable
	 * @param field The field by which to order the response
	 * @returns The request instance (for chaining)
	 */
	orderby( field: string ): this;

	/**
	 * Filter results to those matching the specified search terms.
	 *
	 * @method
	 * @chainable
	 * @param searchString A string to search for within post content
	 * @returns The request instance (for chaining)
	 */
	search( searchString: string ): this;

	/**
	 * Include specific resource IDs in the response collection.
	 *
	 * @method
	 * @chainable
	 * @param ids An ID or array of IDs to include
	 * @returns The request instance (for chaining)
	 */
	include( ids: number | number[] ): this;

	/**
	 * Exclude specific resource IDs in the response collection.
	 *
	 * @method
	 * @chainable
	 * @param ids An ID or array of IDs to exclude
	 * @returns The request instance (for chaining)
	 */
	exclude( ids: number | number[] ): this;

	/**
	 * Query a collection for members with a specific slug.
	 *
	 * @method
	 * @chainable
	 * @param slug A post slug (slug), e.g. "hello-world"
	 * @returns The request instance (for chaining)
	 */
	slug( slug: string ): this;

}

// paramSetter() returns a generically-typed setter (a function of a ParamRequestLike
// value to a ParamRequestLike); each cast below narrows that back down to the specific
// signature declared on the WPRequest interface above.
WPRequest.prototype.context = paramSetter( 'context' ) as unknown as WPRequest[ 'context' ];
WPRequest.prototype.page = paramSetter( 'page' ) as unknown as WPRequest[ 'page' ];
WPRequest.prototype.perPage = paramSetter( 'per_page' ) as unknown as WPRequest[ 'perPage' ];
WPRequest.prototype.offset = paramSetter( 'offset' ) as unknown as WPRequest[ 'offset' ];
WPRequest.prototype.order = paramSetter( 'order' ) as unknown as WPRequest[ 'order' ];
WPRequest.prototype.orderby = paramSetter( 'orderby' ) as unknown as WPRequest[ 'orderby' ];
WPRequest.prototype.search = paramSetter( 'search' ) as unknown as WPRequest[ 'search' ];
WPRequest.prototype.include = paramSetter( 'include' ) as unknown as WPRequest[ 'include' ];
WPRequest.prototype.exclude = paramSetter( 'exclude' ) as unknown as WPRequest[ 'exclude' ];
WPRequest.prototype.slug = paramSetter( 'slug' ) as unknown as WPRequest[ 'slug' ];

export = WPRequest;
