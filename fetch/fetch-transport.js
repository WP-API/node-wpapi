/**
 * @module fetch-transport
 */
'use strict';

const fetch = require( 'node-fetch' );
const FormData = require( 'form-data' );
const fs = require( 'fs' );

const objectReduce = require( '../lib/util/object-reduce' );
const { createPaginationObject } = require( '../lib/pagination' );

/**
 * Utility method to set a header value on a fetch configuration object.
 *
 * @method _setHeader
 * @private
 * @param {Object} config A configuration object of unknown completeness
 * @param {string} header String name of the header to set
 * @param {string} value  Value of the header to set
 * @returns {Object} The modified configuration object
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
 * @param {Object} config A fetch request configuration object
 * @param {Object} options A WPRequest _options object
 * @param {Object} A fetch config object, with any available headers set
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
 * @param {Object} config A fetch request configuration object
 * @param {Object} options A WPRequest _options object
 * @param {Boolean} forceAuthentication whether to force authentication on the request
 * @param {Object} A fetch request object, conditionally configured to use basic auth
 */
function _auth( config, options, forceAuthentication ) {
	// If we're not supposed to authenticate, don't even start
	if ( ! forceAuthentication && ! options.auth && ! options.nonce ) {
		return config;
	}

	// Enable nonce in options for Cookie authentication http://wp-api.org/guides/authentication.html
	if ( options.nonce ) {
		config.credentials = 'same-origin';
		return _setHeader( config, 'X-WP-Nonce', options.nonce );
	}

	// If no username or no password, can't authenticate
	if ( ! options.username || ! options.password ) {
		return config;
	}

	// Can authenticate: set basic auth parameters on the config
	let authorization = `${ options.username }:${ options.password }`;
	if ( global.Buffer ) {
		authorization = global.Buffer.from( authorization ).toString( 'base64' );
	} else if ( global.btoa ) {
		authorization = global.btoa( authorization );
	}

	return _setHeader( config, 'Authorization', `Basic ${ authorization }` );
}

// HTTP-Related Helpers
// ====================

/**
 * Get the response headers as a regular JavaScript object.
 *
 * @param {Object} response Fetch response object.
 */
function getHeaders( response ) {
	const headers = {};
	response.headers.forEach( ( value, key ) => {
		headers[ key ] = value;
	} );
	return headers;
}

/**
 * Return the body of the request, augmented with pagination information if the
 * result is a paged collection.
 *
 * @private
 * @param {WPRequest} wpreq The WPRequest representing the returned HTTP response
 * @param {Object} response The fetch response object for the HTTP call
 * @returns {Object} The JSON data of the response, conditionally augmented with
 *                   pagination information if the response is a partial collection.
 */
const parseFetchResponse = ( response, wpreq ) => {
	// Check if an HTTP error occurred.
	if ( ! response.ok ) {
		// Extract and return the API-provided error object if the response is
		// not ok, i.e. if the error was from the API and not internal to fetch.
		return response.json().then( ( err ) => {
			// Throw the error object to permit proper error handling.
			throw err;
		}, () => {
			// JSON serialization failed; throw the underlying response.
			throw response;
		} );
	}

	// If the response is OK, process & return the JSON data.
	return response.json().then( ( body ) => {
		// Construct a response the pagination helper can understand.
		const mockResponse = {
			headers: getHeaders( response ),
		};

		const _paging = createPaginationObject( mockResponse, wpreq._options, wpreq.transport );
		if ( _paging ) {
			body._paging = _paging;
		}
		return body;
	} );
};

// HTTP Methods: Private HTTP-verb versions
// ========================================

const send = ( wpreq, config ) => fetch(
	wpreq.toString(),
	_setHeaders( _auth( config, wpreq._options ), wpreq._options )
).then( ( response ) => {
	// return response.headers.get( 'Link' );
	return parseFetchResponse( response, wpreq );
} );

/**
 * @method get
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpGet( wpreq ) {
	return send( wpreq, {
		method: 'GET',
	} );
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
	let file = wpreq._attachment;
	if ( file ) {
		// Handle files provided as a path string
		if ( typeof file === 'string' ) {
			file = fs.createReadStream( file );
		}

		// Build the form data object
		const form = new FormData();
		form.append( 'file', file, wpreq._attachmentName );
		Object.keys( data ).forEach( key => form.append( key, data[ key ] ) );

		// Fire off the media upload request
		return send( wpreq, {
			method: 'POST',
			redirect: 'follow',
			body: form,
		} );
	}

	return send( wpreq, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		redirect: 'follow',
		body: JSON.stringify( data ),
	} );
}

/**
 * @method put
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} data The data for the PUT request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpPut( wpreq, data = {} ) {
	return send( wpreq, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		redirect: 'follow',
		body: JSON.stringify( data ),
	} );
}

/**
 * @method delete
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @param {Object} [data] Data to send along with the DELETE request
 * @returns {Promise} A promise to the results of the HTTP request
 */
function _httpDelete( wpreq, data ) {
	const config = {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
		redirect: 'follow',
	};

	if ( data ) {
		config.body = JSON.stringify( data );
	}

	return send( wpreq, config );
}

/**
 * @method head
 * @async
 * @param {WPRequest} wpreq A WPRequest query object
 * @returns {Promise} A promise to the header results of the HTTP request
 */
function _httpHead( wpreq ) {
	const url = wpreq.toString();
	const config = _setHeaders( _auth( {
		method: 'HEAD',
	}, wpreq._options, true ), wpreq._options );

	return fetch( url, config )
		.then( response => getHeaders( response ) );
}

module.exports = {
	delete: _httpDelete,
	get: _httpGet,
	head: _httpHead,
	post: _httpPost,
	put: _httpPut,
};
