type WPRequestOptions = import( '../lib/types' ).WPRequestOptions;

/**
 * @module fetch-transport
 */

import checkMethodSupport = require( '../lib/util/check-method-support' );
import objectReduce = require( '../lib/util/object-reduce' );
import paginationModule = require( '../lib/pagination' );
import WPRequest = require( '../lib/constructors/wp-request' );

const createPaginationObject = paginationModule.createPaginationObject;

/**
 * The shape of the fetch configuration objects built up by this module.
 *
 * This is a narrower, more accurate stand-in for the global `RequestInit`
 * (whose `headers`/`credentials`/`redirect`/`body` fields are broader unions
 * than this module ever actually constructs): it is assignable to
 * `RequestInit`, so the config objects built here can still be passed
 * directly to the global `fetch()`.
 */
interface FetchConfig {
	method?: string;
	headers?: Record<string, string>;
	credentials?: 'same-origin';
	redirect?: 'follow';
	body?: string | FormData;
}

/**
 * Utility method to set a header value on a fetch configuration object.
 *
 * @method _setHeader
 * @private
 * @param config A configuration object of unknown completeness
 * @param header String name of the header to set
 * @param value  Value of the header to set
 * @returns The modified configuration object
 */
const _setHeader = ( config: FetchConfig, header: string, value: string ): FetchConfig => ( {
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
 * @param config  A fetch request configuration object
 * @param options A WPRequest _options object
 * @returns A fetch config object, with any available headers set
 */
function _setHeaders( config: FetchConfig, options: WPRequestOptions ): FetchConfig {
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
 * @param config              A fetch request configuration object
 * @param options             A WPRequest _options object
 * @param forceAuthentication Whether to force authentication on the request
 * @returns A fetch request object, conditionally configured to use basic auth
 */
function _auth( config: FetchConfig, options: WPRequestOptions, forceAuthentication?: boolean ): FetchConfig {
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
	if ( globalThis.Buffer ) {
		authorization = globalThis.Buffer.from( authorization ).toString( 'base64' );
	} else if ( globalThis.btoa ) {
		authorization = globalThis.btoa( authorization );
	}

	return _setHeader( config, 'Authorization', `Basic ${ authorization }` );
}

// HTTP-Related Helpers
// ====================

/**
 * Get the response headers as a regular JavaScript object.
 *
 * @param response Fetch response object.
 */
function getHeaders( response: Response ): Record<string, string> {
	const headers: Record<string, string> = {};
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
 * @param response The fetch response object for the HTTP call
 * @param wpreq    The WPRequest representing the returned HTTP response
 * @returns The JSON data of the response, conditionally augmented with
 *          pagination information if the response is a partial collection.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- response JSON payloads are arbitrary data */
const parseFetchResponse = ( response: Response, wpreq: WPRequest ): Promise<any> => {
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
	return response.json().then( ( body: any ) => {
		// Construct a response the pagination helper can understand.
		const mockResponse = {
			headers: getHeaders( response ),
		};

		// Cast: WPRequestOptions has no index signature, so it isn't structurally
		// assignable to createPaginationObject's Record<string, unknown> parameter.
		const _paging = createPaginationObject(
			mockResponse,
			wpreq._options as unknown as Record<string, unknown>,
			wpreq.transport,
		);
		if ( _paging ) {
			body._paging = _paging;
		}
		return body;
	} );
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Build a native FormData instance for a media upload request, normalizing the
 * attachment into a Blob: Blob/File attachments are appended as-is, Buffers are
 * wrapped, and string paths are read from disk (Node only). Any additional data
 * values are appended as plain form fields.
 *
 * @private
 * @param file   The ._attachment value from a WPRequest
 * @param [name] The ._attachmentName value from a WPRequest
 * @param [data] Additional form fields to append
 * @returns A promise to a populated FormData instance
 */
const createUploadForm = async (
	file: string | Buffer | Blob,
	name?: string,
	data: Record<string, unknown> = {},
): Promise<FormData> => {
	if ( typeof file === 'string' ) {
		// A string is a file system path: read it into a Blob. The lazy require, which must
		// stay a runtime require rather than a static import, keeps the node built-in out
		// of browser bundles, where paths on disk are not a meaningful input.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { readFile } = require( 'node:fs/promises' );
		const fileContents = await readFile( file );
		// Uploads need a file name with an extension for WordPress to accept
		// them; default to the name of the file on disk.
		name = name || file.split( /[\\/]/ ).pop();
		file = new Blob( [ fileContents ] );
	} else if ( globalThis.Buffer && file instanceof globalThis.Buffer ) {
		// Cast: a Node Buffer's ArrayBufferLike backing (which admits
		// SharedArrayBuffer) is narrower than what BlobPart's type expects,
		// though a Buffer is always a valid Blob source at runtime.
		file = new Blob( [ file as unknown as BlobPart ] );
	}

	const form = new FormData();
	// An undefined name is genuinely omitted rather than passed as an explicit third
	// argument: some FormData implementations (Node <=22 among them) coerce a
	// present-but-undefined filename to the string "undefined", clobbering a File
	// attachment's own name, and browser bundles run on engines we don't control.
	// Cast: by this point `file` is always a Blob at runtime (the `string` and
	// `Buffer` cases above always reassign it to one), but TS can't prove the
	// `globalThis.Buffer &&`-guarded branch always narrows away `Buffer`.
	if ( name === undefined ) {
		form.append( 'file', file as Blob );
	} else {
		form.append( 'file', file as Blob, name );
	}
	// Cast: form field values are arbitrary caller-supplied data, but FormData's
	// global (DOM) typing only accepts strings or Blobs.
	Object.keys( data ).forEach( key => form.append( key, data[ key ] as string | Blob ) );
	return form;
};

// HTTP Methods: Private HTTP-verb versions
// ========================================

const send = ( wpreq: WPRequest, config: FetchConfig ) => fetch(
	wpreq.toString(),
	_setHeaders( _auth( config, wpreq._options ), wpreq._options ),
).then( ( response ) => {
	return parseFetchResponse( response, wpreq );
} );

/**
 * @method get
 * @async
 * @param wpreq A WPRequest query object
 * @returns A promise to the results of the HTTP request
 */
function _httpGet( wpreq: unknown ) {
	const req = wpreq as WPRequest;
	checkMethodSupport( 'get', req );
	return send( req, {
		method: 'GET',
	} );
}

/**
 * Invoke an HTTP "POST" request against the provided endpoint
 * @method post
 * @async
 * @param wpreq A WPRequest query object
 * @param data  The data for the POST request
 * @returns A promise to the results of the HTTP request
 */
function _httpPost( wpreq: unknown, data: unknown = {} ) {
	const req = wpreq as WPRequest;
	checkMethodSupport( 'post', req );
	if ( req._attachment ) {
		return createUploadForm( req._attachment, req._attachmentName, data as Record<string, unknown> )
			.then( form => send( req, {
				method: 'POST',
				redirect: 'follow',
				body: form,
			} ) );
	}

	return send( req, {
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
 * @param wpreq A WPRequest query object
 * @param data  The data for the PUT request
 * @returns A promise to the results of the HTTP request
 */
function _httpPut( wpreq: unknown, data: unknown = {} ) {
	const req = wpreq as WPRequest;
	checkMethodSupport( 'put', req );
	return send( req, {
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
 * @param wpreq  A WPRequest query object
 * @param [data] Data to send along with the DELETE request
 * @returns A promise to the results of the HTTP request
 */
function _httpDelete( wpreq: unknown, data?: unknown ) {
	const req = wpreq as WPRequest;
	checkMethodSupport( 'delete', req );
	const config: FetchConfig = {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
		redirect: 'follow',
	};

	if ( data ) {
		config.body = JSON.stringify( data );
	}

	return send( req, config );
}

/**
 * @method head
 * @async
 * @param wpreq A WPRequest query object
 * @returns A promise to the header results of the HTTP request
 */
function _httpHead( wpreq: unknown ): Promise<Record<string, string>> {
	const req = wpreq as WPRequest;
	checkMethodSupport( 'head', req );
	const url = req.toString();
	const config = _setHeaders( _auth( {
		method: 'HEAD',
	}, req._options, true ), req._options );

	return fetch( url, config )
		.then( ( response ) => {
			// HEAD responses have no body to extract an API error from; reject
			// with the underlying response so HTTP errors are not swallowed.
			if ( ! response.ok ) {
				throw response;
			}
			return getHeaders( response );
		} );
}

export = {
	delete: _httpDelete,
	get: _httpGet,
	head: _httpHead,
	post: _httpPost,
	put: _httpPut,
};
