'use strict';
/**
 * @module WP
 * @submodule WPRequest
 * @beta
 */

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'bluebird' );
var agent = require( 'superagent' );
var parseLinkHeader = require( 'li' ).parse;
var url = require( 'url' );
var qs = require( 'qs' );
var _ = require( 'lodash' );
var extend = require( 'node.extend' );

// TODO: reorganize library so that this has a better home
var alphaNumericSort = require( '../util/alphanumeric-sort' );

/**
 * WPRequest is the base API request object constructor
 *
 * @class WPRequest
 * @constructor
 * @param {Object} options A hash of options for the WPRequest instance
 * @param {String} options.endpoint The endpoint URI for the invoking WP instance
 * @param {String} [options.username] A username for authenticating API requests
 * @param {String} [options.password] A password for authenticating API requests
 */
function WPRequest( options ) {
	/**
	 * Configuration options for the request such as the endpoint for the invoking WP instance
	 *
	 * @property _options
	 * @type Object
	 * @private
	 * @default {}
	 */
	this._options = options || {};

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

/** No-op function for use within ensureFunction() */
function noop() {}

/** Identity function for use within invokeAndPromisify() */
function identity( value ) {
	return value;
}

/**
 * If fn is a function, return it; else, return a no-op function
 *
 * @param {Function|undefined} fn A WPRequest request callback
 * @return {Function} The provided callback function or a no-op
 */
function ensureFunction( fn ) {
	return ( typeof fn === 'function' ) ? fn : noop;
}

/**
 * Submit the provided superagent request object, invoke a callback (if it was
 * provided), and return a promise to the response from the HTTP request.
 *
 * @param {Object} request A superagent request object
 * @param {Function} callback A callback function (optional)
 * @param {Function} transform A function to transform the result data
 * @return {Promise} A promise to the superagent request
 */
function invokeAndPromisify( request, callback, transform ) {
	callback = ensureFunction( callback );

	return new Promise(function( resolve, reject ) {
		// Fire off the result
		request.end(function( err, result ) {

			// Return the results as a promise
			if ( err || result.error ) {
				reject( err || result.error );
			} else {
				resolve( result );
			}
		});
	}).then( transform ).nodeify( callback );
}

/**
 * Return the body of the request, augmented with pagination information if the
 * result is a paged collection.
 *
 * @method returnBody
 * @private
 * @param result {Object} The results from the HTTP request
 * @return {Object} The "body" property of the result, conditionally augmented with
 *                  pagination information if the result is a partial collection.
 */
function returnBody( result ) {
	/* jshint validthis:true */
	var endpoint = this._options.endpoint;
	return paginateResponse( result, endpoint ).body;
}

/**
 * Extract and return the headers property from a superagent response object
 *
 * @param {Object} result The results from the HTTP request
 * @return {Object} The "headers" property of the result
 */
function returnHeaders( result ) {
	return result.headers;
}

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
 * @param {Object} taxonomyFilters An object of taxonomy term arrays, keyed by taxonomy name
 * @return {Object} An object of prepareFilters-ready query arg and query param value pairs
 */
function prepareTaxonomies( taxonomyFilters ) {
	if ( ! taxonomyFilters ) {
		return {};
	}

	return _.reduce( taxonomyFilters, function( result, terms, key ) {
		// Trim whitespace and concatenate multiple terms with +
		result[ key ] = terms.map(function( term ) {
			// Coerce term into a string so that trim() won't fail
			term = term + '';
			return term.trim().toLowerCase();
		}).join( '+' );
		return result;
	}, {});
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
 * @param  {Object} obj An object of key/value pairs
 * @return {Object}     That object with all empty values removed
 */
function populated( obj ) {
	if ( ! obj ) {
		return obj;
	}
	return Object.keys( obj ).reduce(function( values, key ) {
		var val = obj[ key ];
		if ( ! _.isUndefined( val ) && ! _.isNull( val ) && val !== '' ) {
			values[ key ] = val;
		}
		return values;
	}, {});
}

/**
 * Assert whether a provided URL component is "valid" by checking it against
 * an array of registered path component validator methods for that level of
 * the URL path.
 *
 * @param {object[]} levelDefinitions An array of Level Definition objects
 * @param {string}   levelContents    The URL path string that has been specified
 *                                    for use on the provided level
 * @returns {boolean} Whether the provided input matches any of the provided
 * level validation functions
 */
function validatePathLevel( levelDefinitions, levelContents ) {
	// One "level" may have multiple options, as a route tree is a branching
	// structure. We consider a level "valid" if the provided levelContents
	// match any of the available validators.
	var valid = levelDefinitions.reduce(function( anyOptionValid, levelOption ) {
		if ( ! levelOption.validate ) {
			// If there is no validator function, the level is implicitly valid
			return true;
		}
		return anyOptionValid || levelOption.validate( levelContents );
	}, false );

	if ( ! valid ) {
		throw new Error([
			'Invalid path component:',
			levelContents,
			// awkward pluralization support:
			'does not match' + ( levelDefinitions.length > 1 ? ' any of' : '' ),
			levelDefinitions.reduce(function( components, levelOption ) {
				return components.concat( levelOption.component );
			}, [] ).join( ', ' )
		].join( ' ' ) );
	}
}

// Pagination-Related Helpers
// ==========================

/**
 * Combine the API endpoint root URI and link URI into a valid request URL.
 * Endpoints are generally a full path to the JSON API's root endpoint, such
 * as `website.com/wp-json`: the link headers, however, are returned as root-
 * relative paths. Concatenating these would generate a URL such as
 * `website.com/wp-json/wp-json/posts?page=2`: we must intelligently merge the
 * URI strings in order to generate a valid new request URL.
 *
 * @param endpoint {String} The endpoint URL for the REST API root
 * @param linkPath {String} A root-relative link path to an API request
 * @returns {String} The full URL path to the provided link
 */
function mergeUrl( endpoint, linkPath ) {
	var request = url.parse( endpoint );
	linkPath = url.parse( linkPath, true );

	// Overwrite relevant request URL object properties with the link's values:
	// Setting these three values from the link will ensure proper URL generation
	request.query = linkPath.query;
	request.search = linkPath.search;
	request.pathname = linkPath.pathname;

	// Reassemble and return the merged URL
	return url.format( request );
}

/**
 * If the response is not paged, return the body as-is. If pagination
 * information is present in the response headers, parse those headers into
 * a custom `_paging` property on the response body. `_paging` contains links
 * to the previous and next pages in the collection, as well as metadata
 * about the size and number of pages in the collection.
 *
 * The structure of the `_paging` property is as follows:
 *
 * - `total` {Integer} The total number of records in the collection
 * - `totalPages` {Integer} The number of pages available
 * - `links` {Object} The parsed "links" headers, separated into individual URI strings
 * - `next` {WPRequest} A WPRequest object bound to the "next" page (if page exists)
 * - `prev` {WPRequest} A WPRequest object bound to the "previous" page (if page exists)
 *
 * @param result {Object} The response object from the HTTP request
 * @param endpoint {String} The base URL of the requested API endpoint
 * @returns {Object} The body of the HTTP request, conditionally augmented with
 *                   pagination metadata
 */
function paginateResponse( result, endpoint ) {
	if ( ! result.headers || ! result.headers[ 'x-wp-totalpages' ] ) {
		// No headers: return as-is
		return result;
	}

	var totalPages = result.headers[ 'x-wp-totalpages' ];

	if ( ! totalPages || totalPages === '0' ) {
		// No paging: return as-is
		return result;
	}

	// Decode the link header object
	var links = result.headers.link ? parseLinkHeader( result.headers.link ) : {};

	// Store pagination data from response headers on the response collection
	result.body._paging = {
		total: result.headers[ 'x-wp-total' ],
		totalPages: totalPages,
		links: links
	};

	// Create a WPRequest instance pre-bound to the "next" page, if available
	if ( links.next ) {
		result.body._paging.next = new WPRequest({
			endpoint: mergeUrl( endpoint, links.next )
		});
	}

	// Create a WPRequest instance pre-bound to the "prev" page, if available
	if ( links.prev ) {
		result.body._paging.prev = new WPRequest({
			endpoint: mergeUrl( endpoint, links.prev )
		});
	}

	return result;
}

// Prototype Methods
// =================

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
 * @return {String} A query string representing the specified filter parameters
 */
WPRequest.prototype._renderQuery = function() {
	// Build the full query parameters object
	var queryParams = extend( {}, populated( this._params ) );

	// Prepare any taxonomies and merge with other filter values
	var taxonomies = prepareTaxonomies( this._taxonomyFilters );
	queryParams.filter = extend( {}, populated( this._filters ), taxonomies );

	// Parse query parameters object into a query string, sorting the object
	// properties by alphabetical order (consistent property ordering can make
	// for easier caching of request URIs)
	var queryString = qs.stringify( queryParams, { arrayFormat: 'brackets' } )
		.split( '&' )
		.sort()
		.join( '&' );

	// Prepend a "?" if a query is present, and return
	return ( queryString === '' ) ? '' : '?' + queryString;
};

/**
 * Set a component of the resource URL itself (as opposed to a query parameter)
 *
 * If a path component has already been set at this level, throw an error:
 * requests are meant to be transient, so any re-writing of a previously-set
 * path part value is likely to be a mistake.
 *
 * @method setPathPart
 * @chainable
 * @param {Number|String} level A "level" of the path to set, e.g. "1" or "2"
 * @param {Number|String} val   The value to set at that path part level
 * @return {WPRequest} The WPRequest instance (for chaining)
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
 * @method validatePath
 * @chainable
 * @returns {WPRequest} The WPRequest instance (for chaining), if no errors were found
 */
WPRequest.prototype.validatePath = function() {
	// Iterate through all _specified_ levels of this endpoint
	var specifiedLevels = Object.keys( this._path )
		.map(function( level ) {
			return parseInt( level, 10 );
		})
		.filter(function( pathPartKey ) {
			return ! isNaN( pathPartKey );
		});

	var maxLevel = Math.max.apply( null, specifiedLevels );

	// Ensure that all necessary levels are specified
	var path = [];
	var valid = true;

	for ( var level = 0; level <= maxLevel; level++ ) {

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
		throw new Error( 'Incomplete URL! Missing component: ' + path.join( '/' ) );
	}

	return this;
};

/**
 * Set a parameter to render into the final query URI.
 *
 * @method param
 * @chainable
 * @param {String|Object} props The name of the parameter to set, or an object containing
 *                              parameter keys and their corresponding values
 * @param {String|Number|Array} [value] The value of the parameter being set
 * @param {Boolean} [merge] Whether to merge the value (true) or replace it (false, default)
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.param = function( props, value, merge ) {
	merge = merge || false;

	if ( ! props || _.isString( props ) && typeof value === 'undefined' ) {
		// We have no property to set, or no value to set for that property
		return this;
	}

	// We can use the same iterator function below to handle explicit key-value
	// pairs if we convert them into to an object we can iterate over:
	if ( _.isString( props ) ) {
		props = _.zipObject([[ props, value ]]);
	}

	// Iterate through the properties
	Object.keys( props ).forEach(function( key ) {
		var value = props[ key ];
		var currentVal = this._params[ key ];

		// Simple case: setting for the first time, or not merging
		if ( ! currentVal || ! merge ) {

			// Arrays should be de-duped and sorted
			if ( _.isArray( value ) ) {
				value = _.unique( value ).sort( alphaNumericSort );
			}

			// Set the value
			this._params[ key ] = value;

			// Continue
			return;
		}

		// value and currentVal must both be arrays in order to merge
		if ( ! _.isArray( currentVal ) ) {
			currentVal = [ currentVal ];
		}

		if ( ! _.isArray( value ) ) {
			value = [ value ];
		}

		// Concat the new values onto the old (and sort)
		this._params[ key ] = _.union( currentVal, value ).sort( alphaNumericSort );
	}.bind( this ));

	return this;
};

/**
 * Set the context of the request. Used primarily to expose private values on a request
 * object, by setting the context to "edit".
 *
 * @method context
 * @chainable
 * @param {String} context The context to set on the request
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.context = function( context ) {
	if ( context === 'edit' ) {
		// Force basic authentication for edit context
		this.auth();
	}
	return this.param( 'context', context );
};

/**
 * Convenience wrapper for `.context( 'edit' )`
 *
 * @method edit
 * @chainable
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.edit = function() {
	return this.context( 'edit' );
};

/**
 * Return embedded resources as part of the response payload.
 *
 * @method embed
 * @chainable
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.embed = function() {
	return this.param( '_embed', true );
};

// HTTP Transport Prototype Methods
// ================================

/**
 * Verify that the current request object supports a given HTTP verb
 *
 * @private
 *
 * @method _checkMethodSupport
 * @param {String} method An HTTP method to check ('get', 'post', etc)
 * @return true iff the method is within this._supportedMethods
 */
WPRequest.prototype._checkMethodSupport = function( method ) {
	if ( this._supportedMethods.indexOf( method.toLowerCase() ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			this._supportedMethods.join( ', ' )
		);
	}

	return true;
};

/**
 * Validate & assemble a path string from the request object's _path
 *
 * @private
 *
 * @method _renderPath
 * @return {String} The rendered path
 */
WPRequest.prototype._renderPath = function() {
	// Call validatePath: if the provided path components are not well-formed,
	// an error will be thrown
	this.validatePath();

	var pathParts = this._path;
	var orderedPathParts = Object.keys( pathParts )
		.sort(function( a, b ) {
			var intA = parseInt( a, 10 );
			var intB = parseInt( b, 10 );
			return intA - intB;
		})
		.map(function( pathPartKey ) {
			return pathParts[ pathPartKey ];
		});

	// Combine all parts of the path together, filtered to omit any components
	// that are unspecified or empty strings, to create the full path template
	var path = [
		this._namespace
	].concat( orderedPathParts ).filter( identity ).join( '/' );

	return path;
};

/**
 * Parse the request's instance properties into a WordPress API request URI
 *
 * @private
 *
 * @method _renderURI
 * @return {String} The URI for the HTTP request to be sent
 */
WPRequest.prototype._renderURI = function() {
	// Render the path to a string
	var path = this._renderPath();

	// Render the query string
	var queryStr = this._renderQuery();

	return this._options.endpoint + path + queryStr;
};

/**
 * Conditionally set basic authentication on a server request object
 *
 * @method _auth
 * @private
 * @param {Object} request A superagent request object
 * @param {Boolean} forceAuthentication whether to force authentication on the request
 * @param {Object} A superagent request object, conditionally configured to use basic auth
 */
WPRequest.prototype._auth = function( request, forceAuthentication ) {
	// If we're not supposed to authenticate, don't even start
	if ( ! forceAuthentication && ! this._options.auth && ! this._options.nonce ) {
		return request;
	}

	// Enable nonce in options for Cookie authentication http://wp-api.org/guides/authentication.html
	if ( this._options.nonce ) {
		request.set( 'X-WP-Nonce', this._options.nonce );
		return request;
	}

	// Retrieve the username & password from the request options if they weren't provided
	var username = username || this._options.username;
	var password = password || this._options.password;

	// If no username or no password, can't authenticate
	if ( ! username || ! password ) {
		return request;
	}

	// Can authenticate: set basic auth parameters on the request
	return request.auth( username, password );
};

// Chaining methods
// ================

/**
 * Set the namespace of the request, e.g. to specify the API root for routes
 * registered by wp core v2 ("wp/v2") or by any given plugin. Any previously-
 * set namespace will be overwritten by subsequent calls to the method.
 *
 * @method namespace
 * @chainable
 * @param {String} namespace A namespace string, e.g. "wp/v2"
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.namespace = function( namespace ) {
	this._namespace = namespace;
	return this;
};

/**
 * Set a requst to use authentication, and optionally provide auth credentials
 *
 * @example
 * If auth credentials were already specified when the WP instance was created, calling
 * `.auth` on the request chain will set that request to use the existing credentials:
 *
 *     request.auth().get...
 *
 * Alternatively, a username & password can be explicitly passed into `.auth`:
 *
 *     request.auth( 'username', 'password' ).get...
 *
 * @method auth
 * @chainable
 * @param {String|Object} [usrOrObj] A username string for basic authentication,
 *                                   or an object with 'username' and 'password'
 *                                   string properties
 * @param {String}        [password] A user password string for basic authentication
 *                                   (ignored if usrOrObj is an object)
 * @return {WPRequest} The WPRequest instance (for chaining)
 */
WPRequest.prototype.auth = function( usrOrObj, password ) {
	if ( typeof usrOrObj === 'object' ) {
		if ( typeof usrOrObj.username === 'string' ) {
			this._options.username = usrOrObj.username;
		}

		if ( typeof usrOrObj.password === 'string' ) {
			this._options.password = usrOrObj.password;
		}
	} else {
		if ( typeof usrOrObj === 'string' ) {
			this._options.username = usrOrObj;
		}

		if ( typeof password === 'string' ) {
			this._options.password = password;
		}
	}

	// Set the "auth" options flag that will force authentication on this request
	this._options.auth = true;

	return this;
};

// HTTP Methods: Private HTTP-verb versions
// ========================================

/**
 * @method _httpGet
 * @async
 * @private
 * @param {Function} [callback] A callback to invoke with the results of the GET request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype._httpGet = function( callback ) {
	this._checkMethodSupport( 'get' );
	var url = this._renderURI();

	var request = this._auth( agent.get( url ) );

	return invokeAndPromisify( request, callback, returnBody.bind( this ) );
};

/**
 * Invoke an HTTP "POST" request against the provided endpoint
 * @method _httpPost
 * @async
 * @private
 * @param {Object} data The data for the POST request
 * @param {Function} [callback] A callback to invoke with the results of the POST request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype._httpPost = function( data, callback ) {
	this._checkMethodSupport( 'post' );
	var url = this._renderURI();
	data = data || {};

	var request = this._auth( agent.post( url ), true ).send( data );

	return invokeAndPromisify( request, callback, returnBody.bind( this ) );
};

/**
 * @method _httpPut
 * @async
 * @private
 * @param {Object} data The data for the PUT request
 * @param {Function} [callback] A callback to invoke with the results of the PUT request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype._httpPut = function( data, callback ) {
	this._checkMethodSupport( 'put' );
	var url = this._renderURI();
	data = data || {};

	var request = this._auth( agent.put( url ), true ).send( data );

	return invokeAndPromisify( request, callback, returnBody.bind( this ) );
};

/**
 * @method _httpDelete
 * @async
 * @private
 * @param {Object} [data] Data to send along with the DELETE request
 * @param {Function} [callback] A callback to invoke with the results of the DELETE request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype._httpDelete = function( data, callback ) {
	if ( ! callback && typeof data === 'function' ) {
		callback = data;
		data = null;
	}
	this._checkMethodSupport( 'delete' );
	var url = this._renderURI();
	var request = this._auth( agent.del( url ), true ).send( data );

	return invokeAndPromisify( request, callback, returnBody.bind( this ) );
};

/**
 * @method _httpHead
 * @async
 * @private
 * @param {Function} [callback] A callback to invoke with the results of the HEAD request
 * @return {Promise} A promise to the header results of the HTTP request
 */
WPRequest.prototype._httpHead = function( callback ) {
	this._checkMethodSupport( 'head' );
	var url = this._renderURI();
	var request = this._auth( agent.head( url ) );

	return invokeAndPromisify( request, callback, returnHeaders );
};

// HTTP Methods: Public Interface
// ==============================

/** @deprecated Use .create() */
WPRequest.prototype.post = function( data, callback ) {
	return this._httpPost( data, callback );
};

/** @deprecated Use .update() */
WPRequest.prototype.put = function( data, callback ) {
	return this._httpPut( data, callback );
};

/**
 * @method get
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the GET request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.get = function( callback ) {
	return this._httpGet( callback );
};

/**
 * Create a HEAD request against a site
 * @method headers
 * @async
 * @param {Function} [callback] A callback to invoke with the results of the HEAD request
 * @return {Promise} A promise to the header results of the HTTP request
 */
WPRequest.prototype.headers = function( callback ) {
	return this._httpHead( callback );
};

/**
 * Invoke an HTTP "POST" request against the provided endpoint
 *
 * This is the public interface creating for POST requests
 *
 * @method create
 * @async
 * @param {Object} data The data for the POST request
 * @param {Function} [callback] A callback to invoke with the results of the POST request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.create = function( data, callback ) {
	return this._httpPost( data, callback );
};

/**
 * @method _httpPut
 * @async
 * @private
 * @param {Object} data The data for the PUT request
 * @param {Function} [callback] A callback to invoke with the results of the PUT request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.update = function( data, callback ) {
	return this._httpPut( data, callback );
};

/**
 * @method delete
 * @async
 * @param {Object} [data] Data to send along with the DELETE request
 * @param {Function} [callback] A callback to invoke with the results of the DELETE request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.delete = function( data, callback ) {
	return this._httpDelete( data, callback );
};

/**
 * Calling .then on a query chain will invoke the query as a GET and return a promise
 *
 * @method then
 * @async
 * @param {Function} [successCallback] A callback to handle the data returned from the GET request
 * @param {Function} [failureCallback] A callback to handle any errors encountered by the request
 * @return {Promise} A promise to the results of the HTTP request
 */
WPRequest.prototype.then = function( successCallback, failureCallback ) {
	return this._httpGet().then( successCallback, failureCallback );
};

module.exports = WPRequest;
