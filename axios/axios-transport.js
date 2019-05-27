/**
 * @module http-transport
 */
'use strict';

const axios = require( 'axios' );
const parseLinkHeader = require( 'li' ).parse;
const FormData = require( 'form-data' );

const WPRequest = require( '../lib/constructors/wp-request' );
const objectReduce = require( '../lib/util/object-reduce' );
const isEmptyObject = require( '../lib/util/is-empty-object' );

/**
 * Utility method to set a header value on an axios configuration object.
 *
 * @method _setHeader
 * @private
 * @param {Object} config A configuration object of unknown completeness
 * @param {string} header String name of the header to set
 * @param {string} value  Value of the header to set
 * @returns {Object} The modified configuration object
 */
/**
 *
 */
const _setHeader = ( config, header, value ) => ( {
	...config,
	headers: {
		...( config && config.headers ? config.headers : null ),
		[ header ]: value,
	},
} );

/**
 * Set any provided headers on the outgoing request object. Runs after _auth.
 *
 * @method _setHeaders
 * @private
 * @param {Object} config An axios request configuration object
 * @param {Object} options A WPRequest _options object
 * @param {Object} An axios config object, with any available headers set
 */
function _setHeaders( config, options ) {
	// If there's no headers, do nothing
	if ( ! options.headers ) {
		return config;
	}

	return objectReduce(
		options.headers,
		( config, value, key ) => _setHeader( config, key, value ),
		config,
	);
}

/**
 * Conditionally set basic or nonce authentication on a server request object.
 *
 * @method _auth
 * @private
 * @param {Object} config An axios request configuration object
 * @param {Object} options A WPRequest _options object
 * @param {Boolean} forceAuthentication whether to force authentication on the request
 * @param {Object} An axios request object, conditionally configured to use basic auth
 */
function _auth( config, options, forceAuthentication ) {
	// If we're not supposed to authenticate, don't even start
	if ( ! forceAuthentication && ! options.auth && ! options.nonce ) {
		return config;
	}

	// Enable nonce in options for Cookie authentication http://wp-api.org/guides/authentication.html
	if ( options.nonce ) {
		return _setHeader( config, 'X-WP-Nonce', options.nonce );
	}

	// If no username or no password, can't authenticate
	if ( ! options.username || ! options.password ) {
		return config;
	}

	// Can authenticate: set basic auth parameters on the config
	return {
		...config,
		auth: {
			username: options.username,
			password: options.password,
		},
	};
}

// Pagination-Related Helpers
// ==========================

/**
 * Extract the body property from the axios response, or else try to parse
 * the response text to get a JSON object.
 *
 * @private
 * @param {Object} response      The response object from the HTTP request
 * @param {String} response.text The response content as text
 * @param {Object} response.body The response content as a JS object
 * @returns {Object} The response content as a JS object
 */
function extractResponseBody( response ) {
	let responseBody = response.data;
	if ( isEmptyObject( responseBody ) && response.type === 'text/html' ) {
		// Response may have come back as HTML due to caching plugin; try to parse
		// the response text into JSON
		try {
			responseBody = JSON.parse( response.text );
		} catch ( e ) {
			// Swallow errors, it's OK to fall back to returning the body
		}
	}
	return responseBody;
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
 * @private
 * @param {Object} response           The response object from the HTTP request
 * @param {Object} options          The options hash from the original request
 * @param {String} options.endpoint The base URL of the requested API endpoint
 * @param {Object} httpTransport    The HTTP transport object used by the original request
 * @returns {Object} The pagination metadata object for this HTTP request, or else null
 */
function createPaginationObject( response, options, httpTransport ) {
	let _paging = null;

	if ( ! response.headers ) {
		// No headers: return as-is
		return _paging;
	}

	const headers = response.headers;

	// Guard against capitalization inconsistencies in returned headers
	Object.keys( headers ).forEach( ( header ) => {
		headers[ header.toLowerCase() ] = headers[ header ];
	} );

	if ( ! headers[ 'x-wp-totalpages' ] ) {
		// No paging: return as-is
		return _paging;
	}

	const totalPages = +headers[ 'x-wp-totalpages' ];

	if ( ! totalPages || totalPages === 0 ) {
		// No paging: return as-is
		return _paging;
	}

	// Decode the link header object
	const links = headers.link ?
		parseLinkHeader( headers.link ) :
		{};

	// Store pagination data from response headers on the response collection
	_paging = {
		total: +headers[ 'x-wp-total' ],
		totalPages: totalPages,
		links: links,
	};

	// Create a WPRequest instance pre-bound to the "next" page, if available
	if ( links.next ) {
		_paging.next = new WPRequest( {
			...options,
			transport: httpTransport,
			endpoint: links.next,
		} );
	}

	// Create a WPRequest instance pre-bound to the "prev" page, if available
	if ( links.prev ) {
		_paging.prev = new WPRequest( {
			...options,
			transport: httpTransport,
			endpoint: links.prev,
		} );
	}

	return _paging;
}

// HTTP-Related Helpers
// ====================

/**
 * Return the body of the request, augmented with pagination information if the
 * result is a paged collection.
 *
 * @private
 * @param {WPRequest} wpreq The WPRequest representing the returned HTTP response
 * @param {Object} response The axios response object for the HTTP call
 * @returns {Object} The "body" property of the response, conditionally augmented with
 *                  pagination information if the response is a partial collection.
 */
function returnBody( wpreq, response ) {
	// console.log( response );
	console.log( wpreq.toString() );
	console.log( response.headers );
	const body = extractResponseBody( response );
	const _paging = createPaginationObject( response, wpreq._options, wpreq.transport );
	if ( _paging ) {
		body._paging = _paging;
	}
	return body;
}

/**
 * Handle errors received during axios requests.
 *
 * @param {Object} err Axios error response object.
 */
function handleErrors( err ) {
	// Check to see if a request came back at all.
	// If the API provided an error object, it will be available within the
	// axios response object as .response.data (containing the response
	// JSON). If that object exists, it will have a .code property if it is
	// truly an API error (non-API errors will not have a .code).
	if ( err.response && err.response.data && err.response.data.code ) {
		// Forward API error response JSON on to the calling method: omit
		// all transport-specific (axios-specific) properties
		throw err.response.data;
	}
	// Re-throw the unmodified error for other issues, to aid debugging.
	throw err;
}

// HTTP Methods: Private HTTP-verb versions
// ========================================

/**
 * @method get
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpGet( wpreq ) {
	const url = wpreq.toString();

	const config = _setHeaders( _auth( {}, wpreq._options ), wpreq._options );
	return axios.get( url, {
		auth: {
			username: 'admin',
			password: 'password',
		},
	} )
		.then( (r) => {
			console.log( r.headers );
			console.log( '<<' );
			return r;
		} )
		.then( response => returnBody( wpreq, response ) )
		.catch( handleErrors );
}

/**
 * Invoke an HTTP "POST" request against the provided endpoint
 * @method post
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} data The data for the POST request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpPost( wpreq, data = {} ) {
	const url = wpreq.toString();

	let config = _setHeaders( _auth( {}, wpreq._options, true ), wpreq._options );

	if ( wpreq._attachment ) {
		// Data must be form-encoded alongside image attachment
		const form = new FormData();
		data = objectReduce(
			data,
			( form, value, key ) => form.append( key, value ),
			// TODO: Probably need to read in the file if a string path is given
			form.append( 'file', wpreq._attachment, wpreq._attachmentName )
		);
		config = objectReduce(
			form.getHeaders(),
			( config, value, key ) => _setHeader( config, key, value ),
			config
		);
	}

	return axios.post( url, data, config )
		.then( response => returnBody( wpreq, response ) )
		.catch( handleErrors );
}

/**
 * @method put
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} data The data for the PUT request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpPut( wpreq, data = {} ) {
	const url = wpreq.toString();

	const config = _setHeaders( _auth( {}, wpreq._options, true ), wpreq._options );

	return axios.put( url, data, config )
		.then( response => returnBody( wpreq, response ) )
		.catch( handleErrors );
}

/**
 * @method delete
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} [data] Data to send along with the DELETE request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpDelete( wpreq, data ) {
	const url = wpreq.toString();
	const config = _setHeaders( _auth( {}, wpreq._options, true ), wpreq._options );

	// See https://github.com/axios/axios/issues/897#issuecomment-343715381
	if ( data ) {
		config.data = data;
	}

	return axios.delete( url, config )
		.then( response => returnBody( wpreq, response ) )
		.catch( handleErrors );
}

/**
 * @method head
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @returns {Promise} A promise to the header results of the HTTP request
 */
function _httpHead( wpreq ) {
	const url = wpreq.toString();
	const config = _setHeaders( _auth( {}, wpreq._options, true ), wpreq._options );

	return axios.head( url, config )
		.then( response => response.headers )
		.catch( handleErrors );
}

module.exports = {
	delete: _httpDelete,
	get: _httpGet,
	head: _httpHead,
	post: _httpPost,
	put: _httpPut,
};
