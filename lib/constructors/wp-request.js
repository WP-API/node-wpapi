'use strict';

const qs = require( 'qs' );

const alphaNumericSort = require( '../util/alphanumeric-sort' );
const keyValToObj = require( '../util/key-val-to-obj' );
const paramSetter = require( '../util/parameter-setter' );
const objectReduce = require( '../util/object-reduce' );
const unique = require( '../util/unique' );

/**
 * WPRequest is the base API request object constructor
 *
 * @constructor WPRequest
 * @param {Object} options A hash of options for the WPRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WPAPI instance
 * @param {Object} options.transport An object of http transport methods (get, post, etc)
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 * @param {String} [options.nonce] A WP nonce for use with cookie authentication
 */
function WPRequest( options ) {
	/**
	 * Configuration options for the request
	 *
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = [
		// Whitelisted options keys
		'auth',
		'endpoint',
		'headers',
		'username',
		'password',
		'nonce',
	].reduce( ( localOptions, key ) => {
		if ( options && options[ key ] ) {
			localOptions[ key ] = options[ key ];
		}
		return localOptions;
	}, {} );

	/**
	 * The HTTP transport methods (.get, .post, .put, .delete, .head) to use for this request
	 *
	 * @property transport
	 * @type {Object}
	 * @private
	 */
	this.transport = options && options.transport;

	/**
	 * A hash of query parameters
	 * This is used to store the values for supported query parameters like ?_embed
	 *
	 * @property _params
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._params = {};

	/**
	 * Methods supported by this API request instance:
	 * Individual endpoint handlers specify their own subset of supported methods
	 *
	 * @property _supportedMethods
	 * @type Array
	 * @private
	 * @default [ 'head', 'get', 'put', 'post', 'delete' ]
	 */
	this._supportedMethods = [ 'head', 'get', 'put', 'post', 'delete' ];

	/**
	 * A hash of values to assemble into the API request path
	 * (This will be overwritten by each specific endpoint handler constructor)
	 *
	 * @property _path
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._path = {};
}

// Private helper methods
// ======================

/**
 * Identity function for use within invokeAndPromisify()
 * @private
 */
const identity = value => value;

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
 * @param {Object} taxonomyFilters An object of taxonomy term arrays, keyed by taxonomy name
 * @returns {Object} An object of prepareFilters-ready query arg and query param value pairs
 */
function prepareTaxonomies( taxonomyFilters ) {
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
		{}
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
 * @param {Object} obj An object of key/value pairs
 * @returns {Object} That object with all empty values removed
 */
const populated = ( obj ) => {
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
		{}
	);
};

/**
 * Assert whether a provided URL component is "valid" by checking it against
 * an array of registered path component validator methods for that level of
 * the URL path.
 *
 * @private
 * @param {object[]} levelDefinitions An array of Level Definition objects
 * @param {string}   levelContents    The URL path string that has been specified
 *                                    for use on the provided level
 * @returns {boolean} Whether the provided input matches any of the provided
 * level validation functions
 */
const validatePathLevel = ( levelDefinitions, levelContents ) => {
	// One "level" may have multiple options, as a route tree is a branching
	// structure. We consider a level "valid" if the provided levelContents
	// match any of the available validators.
	const valid = levelDefinitions.reduce( ( anyOptionValid, levelOption ) => {
		if ( ! levelOption.validate ) {
			// If there is no validator function, the level is implicitly valid
			return true;
		}
		return anyOptionValid || levelOption.validate( levelContents );
	}, false );

	if ( ! valid ) {
		throw new Error( [
			'Invalid path component:',
			levelContents,
			// awkward pluralization support:
			'does not match' + ( levelDefinitions.length > 1 ? ' any of' : '' ),
			levelDefinitions.reduce(
				( components, levelOption ) => components.concat( levelOption.component ),
				[]
			).join( ', ' ),
		].join( ' ' ) );
	}
};

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
 * @returns {String} A query string representing the specified filter parameters
 */
WPRequest.prototype._renderQuery = function() {
	// Build the full query parameters object
	const queryParams = {
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
};

/**
 * Validate & assemble a path string from the request object's _path
 *
 * @private
 * @returns {String} The rendered path
 */
WPRequest.prototype._renderPath = function() {
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
	const path = [
		this._namespace,
	].concat( orderedPathParts ).filter( identity ).join( '/' );

	return path;
};

// Public Prototype Methods
// ========================

/**
 * Parse the request into a WordPress API request URI string
 *
 * @method
 * @returns {String} The URI for the HTTP request to be sent
 */
WPRequest.prototype.toString = function() {
	// Render the path to a string
	const path = this._renderPath();

	// Render the query string
	const queryStr = this._renderQuery();

	return this._options.endpoint + path + queryStr;
};

/**
 * Set a component of the resource URL itself (as opposed to a query parameter)
 *
 * If a path component has already been set at this level, throw an error:
 * requests are meant to be transient, so any re-writing of a previously-set
 * path part value is likely to be a mistake.
 *
 * @method
 * @chainable
 * @param {Number|String} level A "level" of the path to set, e.g. "1" or "2"
 * @param {Number|String} val   The value to set at that path part level
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.setPathPart = function( level, val ) {
	if ( this._path[ level ] ) {
		throw new Error( 'Cannot overwrite value ' + this._path[ level ] );
	}
	this._path[ level ] = val;

	return this;
};

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
 * @returns {WPRequest} The WPRequest instance (for chaining), if no errors were found
 */
WPRequest.prototype.validatePath = function() {
	// Iterate through all _specified_ levels of this endpoint
	const specifiedLevels = Object.keys( this._path )
		.map( level => parseInt( level, 10 ) )
		.filter( pathPartKey => ! isNaN( pathPartKey ) );

	const maxLevel = Math.max.apply( null, specifiedLevels );

	// Ensure that all necessary levels are specified
	const path = [];
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
};

/**
 * Set a parameter to render into the final query URI.
 *
 * @method
 * @chainable
 * @param {String|Object} props The name of the parameter to set, or an object containing
 *                              parameter keys and their corresponding values
 * @param {String|Number|Array} [value] The value of the parameter being set
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.param = function( props, value ) {
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
			value = unique( value ).sort( alphaNumericSort );
		}

		// Set the value
		this._params[ key ] = value;
	} );

	return this;
};

// Globally-applicable parameters that impact the shape of the request or response
// ===============================================================================

/**
 * Set the context of the request. Used primarily to expose private values on a
 * request object by setting the context to "edit".
 *
 * @method
 * @chainable
 * @param {String} context The context to set on the request
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.context = paramSetter( 'context' );

/**
 * Convenience wrapper for `.context( 'edit' )`
 *
 * @method
 * @chainable
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.edit = function() {
	return this.context( 'edit' );
};

/**
 * Return embedded resources as part of the response payload.
 *
 * @method
 * @chainable
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.embed = function() {
	return this.param( '_embed', true );
};

// Parameters supported by all/nearly all default collections
// ==========================================================

/**
 * Set the pagination of a request. Use in conjunction with `.perPage()` for explicit
 * pagination handling. (The number of pages in a response can be retrieved from the
 * response's `_paging.totalPages` property.)
 *
 * @method
 * @chainable
 * @param {Number} pageNumber The page number of results to retrieve
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.page = paramSetter( 'page' );

/**
 * Set the number of items to be returned in a page of responses.
 *
 * @method
 * @chainable
 * @param {Number} itemsPerPage The number of items to return in one page of results
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.perPage = paramSetter( 'per_page' );

/**
 * Set an arbitrary offset to retrieve items from a specific point in a collection.
 *
 * @method
 * @chainable
 * @param {Number} offsetNumber The number of items by which to offset the response
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.offset = paramSetter( 'offset' );

/**
 * Change the sort direction of a returned collection
 *
 * @example <caption>order comments chronologically (oldest first)</caption>
 *
 *     site.comments().order( 'asc' )...
 *
 * @method
 * @chainable
 * @param {String} direction The order to use when sorting the response
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.order = paramSetter( 'order' );

/**
 * Order a collection by a specific field
 *
 * @method
 * @chainable
 * @param {String} field The field by which to order the response
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.orderby = paramSetter( 'orderby' );

/**
 * Filter results to those matching the specified search terms.
 *
 * @method
 * @chainable
 * @param {String} searchString A string to search for within post content
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.search = paramSetter( 'search' );

/**
 * Include specific resource IDs in the response collection.
 *
 * @method
 * @chainable
 * @param {Number|Number[]} ids An ID or array of IDs to include
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.include = paramSetter( 'include' );

/**
 * Exclude specific resource IDs in the response collection.
 *
 * @method
 * @chainable
 * @param {Number|Number[]} ids An ID or array of IDs to exclude
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.exclude = paramSetter( 'exclude' );

/**
 * Query a collection for members with a specific slug.
 *
 * @method
 * @chainable
 * @param {String} slug A post slug (slug), e.g. "hello-world"
 * @returns The request instance (for chaining)
 */
WPRequest.prototype.slug = paramSetter( 'slug' );

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
 * @param {String} namespace A namespace string, e.g. "wp/v2"
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.namespace = function( namespace ) {
	this._namespace = namespace;
	return this;
};

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
 * @param {Object} credentials            An object with 'username' and 'password' string
 *                                        properties, or else a 'nonce' property
 * @param {String} [credentials.username] A WP-API Basic HTTP Authentication username
 * @param {String} [credentials.password] A WP-API Basic HTTP Authentication password
 * @param {String} [credentials.nonce]    A WP nonce for use with cookie authentication
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.auth = function( credentials ) {
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
};

/**
 * Specify a file or a file buffer to attach to the request, for use when
 * creating a new Media item
 *
 * @example <caption>within a server context</caption>
 *
 *     wp.media()
 *       // Pass .file() the file system path to a file to upload
 *       .file( '/path/to/file.jpg' )
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
 * @param {string|object} file   A path to a file (in Node) or an file object
 *                               (Node or Browser) to attach to the request
 * @param {string}        [name] An (optional) filename to use for the file
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.file = function( file, name ) {
	this._attachment = file;
	// Explicitly set to undefined if not provided, to override any previously-
	// set attachment name property that might exist from a prior `.file()` call
	this._attachmentName = name ? name : undefined;
	return this;
};

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
 * @param {String|Object} headers The name of the header to set, or an object of
 *                                header names and their associated string values
 * @param {String}        [value] The value of the header being set
 * @returns {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.setHeaders = function( headers, value ) {
	// We can use the same iterator function below to handle explicit key-value
	// pairs if we convert them into to an object we can iterate over:
	if ( typeof headers === 'string' ) {
		headers = keyValToObj( headers, value );
	}

	this._options.headers = {
		...( this._options.headers || {} ),
		...headers,
	};

	return this;
};

/**
 * Get (download the data for) the specified resource
 *
 * @method
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the GET request
 * @returns {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.get = function( callback ) {
	return this.transport.get( this, callback );
};

/**
 * Get the headers for the specified resource
 *
 * @method
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the HEAD request
 * @returns {Promise} A promise to the header results of the HTTP request
 */
WPRequest.prototype.headers = function( callback ) {
	return this.transport.head( this, callback );
};

/**
 * Create the specified resource with the provided data
 *
 * This is the public interface for creating POST requests
 *
 * @method
 * @async
 * @param {Object} data The data for the POST request
 * @param {Function} [callback] A callback to invoke with the results of the POST request
 * @returns {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.create = function( data, callback ) {
	return this.transport.post( this, data, callback );
};

/**
 * Update the specified resource with the provided data
 *
 * This is the public interface for creating PUT requests
 *
 * @method
 * @async
 * @private
 * @param {Object} data The data for the PUT request
 * @param {Function} [callback] A callback to invoke with the results of the PUT request
 * @returns {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.update = function( data, callback ) {
	return this.transport.put( this, data, callback );
};

/**
 * Delete the specified resource
 *
 * @method
 * @async
 * @param {Object} [data] Data to send along with the DELETE request
 * @param {Function} [callback] A callback to invoke with the results of the DELETE request
 * @returns {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.delete = function( data, callback ) {
	return this.transport.delete( this, data, callback );
};

/**
 * Calling .then on a query chain will invoke the query as a GET and return a promise
 *
 * @method
 * @async
 * @param {Function} [successCallback] A callback to handle the data returned from the GET request
 * @param {Function} [failureCallback] A callback to handle any errors encountered by the request
 * @returns {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.then = function( successCallback, failureCallback ) {
	return this.transport.get( this ).then( successCallback, failureCallback );
};

module.exports = WPRequest;
