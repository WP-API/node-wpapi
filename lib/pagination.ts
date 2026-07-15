import li = require( 'li' );

const parseLinkHeader = li.parse;

import WPRequest = require( '../lib/constructors/wp-request' );

/**
 * Minimal shape of the pagination-relevant response data passed in by the
 * HTTP transport: a plain object of (possibly mixed-case) response headers.
 */
interface PagingResult {
	headers?: Record<string, string>;
}

/**
 * Pagination metadata parsed from a paged collection response's headers.
 */
interface Paging {
	total: number;
	totalPages: number;
	links: Record<string, string>;
	next?: InstanceType<typeof WPRequest>;
	prev?: InstanceType<typeof WPRequest>;
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
 * - `total` The total number of records in the collection
 * - `totalPages` The number of pages available
 * - `links` The parsed "links" headers, separated into individual URI strings
 * - `next` A WPRequest object bound to the "next" page (if page exists)
 * - `prev` A WPRequest object bound to the "previous" page (if page exists)
 *
 * @private
 * @param result The response object from the HTTP request
 * @param options The options hash from the original request
 * @param options.endpoint The base URL of the requested API endpoint
 * @param httpTransport The HTTP transport object used by the original request
 * @returns The pagination metadata object for this HTTP request, or else null
 */
function createPaginationObject(
	result: PagingResult,
	options: Record<string, unknown>,
	httpTransport: object,
): Paging | null {
	let _paging: Paging | null = null;

	const headers = result.headers;

	if ( ! headers ) {
		// No headers: return as-is
		return _paging;
	}

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

export = {
	createPaginationObject,
};
