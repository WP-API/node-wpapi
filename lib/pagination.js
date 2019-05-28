const parseLinkHeader = require( 'li' ).parse;

const WPRequest = require( '../lib/constructors/wp-request' );

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
 * @param {Object} result           The response object from the HTTP request
 * @param {Object} options          The options hash from the original request
 * @param {String} options.endpoint The base URL of the requested API endpoint
 * @param {Object} httpTransport    The HTTP transport object used by the original request
 * @returns {Object} The pagination metadata object for this HTTP request, or else null
 */
function createPaginationObject( result, options, httpTransport ) {
	let _paging = null;

	if ( ! result.headers ) {
		console.log( 'NOPE' );
		console.log( result.headers );
		// No headers: return as-is
		return _paging;
	}

	// Guard against capitalization inconsistencies in returned headers
	Object.keys( result.headers ).forEach( ( header ) => {
		result.headers[ header.toLowerCase() ] = result.headers[ header ];
	} );

	if ( ! result.headers[ 'x-wp-totalpages' ] ) {
		// No paging: return as-is
		return _paging;
	}

	const totalPages = +result.headers[ 'x-wp-totalpages' ];

	if ( ! totalPages || totalPages === 0 ) {
		// No paging: return as-is
		return _paging;
	}

	// Decode the link header object
	const links = result.headers.link ?
		parseLinkHeader( result.headers.link ) :
		{};

	// Store pagination data from response headers on the response collection
	_paging = {
		total: +result.headers[ 'x-wp-total' ],
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

module.exports = {
	createPaginationObject,
};
