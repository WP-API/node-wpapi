/**
 * @module http-transport
 */
'use strict';

const agent = require( 'superagent' );

const checkMethodSupport = require( '../lib/util/check-method-support' );
const objectReduce = require( '../lib/util/object-reduce' );
const isEmptyObject = require( '../lib/util/is-empty-object' );
const { createPaginationObject } = require( '../lib/pagination' );

/**
 * Set any provided headers on the outgoing request object. Runs after _auth.
 *
 * @method _setHeaders
 * @private
 * @param {Object} request A superagent request object
 * @param {Object} options A WPRequest _options object
 * @param {Object} A superagent request object, with any available headers set
 */
function _setHeaders( request, options ) {
	// If there's no headers, do nothing
	if ( ! options.headers ) {
		return request;
	}

	return objectReduce(
		options.headers,
		( request, value, key ) => request.set( key, value ),
		request
	);
}

/**
 * Conditionally set basic authentication on a server request object.
 *
 * @method _auth
 * @private
 * @param {Object} request A superagent request object
 * @param {Object} options A WPRequest _options object
 * @param {Boolean} forceAuthentication whether to force authentication on the request
 * @param {Object} A superagent request object, conditionally configured to use basic auth
 */
function _auth( request, options, forceAuthentication ) {
	// If we're not supposed to authenticate, don't even start
	if ( ! forceAuthentication && ! options.auth && ! options.nonce ) {
		return request;
	}

	// Enable nonce in options for Cookie authentication http://wp-api.org/guides/authentication.html
	if ( options.nonce ) {
		request.set( 'X-WP-Nonce', options.nonce );
		return request;
	}

	// Retrieve the username & password from the request options if they weren't provided
	const username = options.username;
	const password = options.password;

	// If no username or no password, can't authenticate
	if ( ! username || ! password ) {
		return request;
	}

	// Can authenticate: set basic auth parameters on the request
	return request.auth( username, password );
}

// Pagination-Related Helpers
// ==========================

/**
 * Extract the body property from the superagent response, or else try to parse
 * the response text to get a JSON object.
 *
 * @private
 * @param {Object} response      The response object from the HTTP request
 * @param {String} response.text The response content as text
 * @param {Object} response.body The response content as a JS object
 * @returns {Object} The response content as a JS object
 */
function extractResponseBody( response ) {
	let responseBody = response.body;
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

// HTTP-Related Helpers
// ====================

/**
 * Submit the provided superagent request object and return a promise which
 * resolves to the response from the HTTP request.
 *
 * @private
 * @param {Object} request A superagent request object
 * @param {Function} transform A function to transform the result data
 * @returns {Promise} A promise to the superagent request
 */
function invokeAndPromisify( request, transform ) {
	return new Promise( ( resolve, reject ) => {
		// Fire off the result
		request.end( ( err, result ) => {

			// Return the results as a promise
			if ( err || result.error ) {
				reject( err || result.error );
			} else {
				resolve( result );
			}
		} );
	} ).then( transform ).catch( ( err ) => {
		// If the API provided an error object, it will be available within the
		// superagent response object as response.body (containing the response
		// JSON). If that object exists, it will have a .code property if it is
		// truly an API error (non-API errors will not have a .code).
		if ( err.response && err.response.body && err.response.body.code ) {
			// Forward API error response JSON on to the calling method: omit
			// all transport-specific (superagent-specific) properties
			err = err.response.body;
		}
		// Re-throw the error so that it can be handled by a Promise .catch or .then
		throw err;
	} );
}

/**
 * Return the body of the request, augmented with pagination information if the
 * result is a paged collection.
 *
 * @private
 * @param {WPRequest} wpreq The WPRequest representing the returned HTTP response
 * @param {Object} result The results from the HTTP request
 * @returns {Object} The "body" property of the result, conditionally augmented with
 *                  pagination information if the result is a partial collection.
 */
function returnBody( wpreq, result ) {
	const body = extractResponseBody( result );
	const _paging = createPaginationObject( result, wpreq._options, wpreq.transport );
	if ( _paging ) {
		body._paging = _paging;
	}
	return body;
}

/**
 * Extract and return the headers property from a superagent response object
 *
 * @private
 * @param {Object} result The results from the HTTP request
 * @returns {Object} The "headers" property of the result
 */
function returnHeaders( result ) {
	return result.headers;
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
	checkMethodSupport( 'get', wpreq );
	const url = wpreq.toString();

	let request = _auth( agent.get( url ), wpreq._options );
	request = _setHeaders( request, wpreq._options );

	return invokeAndPromisify( request, returnBody.bind( null, wpreq ) );
}

/**
 * Invoke an HTTP "POST" request against the provided endpoint
 * @method post
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} data The data for the POST request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpPost( wpreq, data ) {
	checkMethodSupport( 'post', wpreq );
	const url = wpreq.toString();
	data = data || {};
	let request = _auth( agent.post( url ), wpreq._options, true );
	request = _setHeaders( request, wpreq._options );

	if ( wpreq._attachment ) {
		// Data must be form-encoded alongside image attachment
		request = objectReduce(
			data,
			( req, value, key ) => req.field( key, value ),
			request.attach( 'file', wpreq._attachment, wpreq._attachmentName )
		);
	} else {
		request = request.send( data );
	}

	return invokeAndPromisify( request, returnBody.bind( null, wpreq ) );
}

/**
 * @method put
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} data The data for the PUT request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpPut( wpreq, data ) {
	checkMethodSupport( 'put', wpreq );
	const url = wpreq.toString();
	data = data || {};

	let request = _auth( agent.put( url ), wpreq._options, true ).send( data );
	request = _setHeaders( request, wpreq._options );

	return invokeAndPromisify( request, returnBody.bind( null, wpreq ) );
}

/**
 * @method delete
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} [data] Data to send along with the DELETE request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpDelete( wpreq, data ) {
	checkMethodSupport( 'delete', wpreq );
	const url = wpreq.toString();
	let request = _auth( agent.del( url ), wpreq._options, true ).send( data );
	request = _setHeaders( request, wpreq._options );

	return invokeAndPromisify( request, returnBody.bind( null, wpreq ) );
}

/**
 * @method head
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @returns {Promise} A promise to the header results of the HTTP request
 */
function _httpHead( wpreq ) {
	checkMethodSupport( 'head', wpreq );
	const url = wpreq.toString();
	let request = _auth( agent.head( url ), wpreq._options );
	request = _setHeaders( request, wpreq._options );

	return invokeAndPromisify( request, returnHeaders );
}

module.exports = {
	delete: _httpDelete,
	get: _httpGet,
	head: _httpHead,
	post: _httpPost,
	put: _httpPut,
};
