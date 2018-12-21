/**
 * Utility methods used when querying a site in order to discover its available
 * API endpoints
 *
 * @module autodiscovery
 */
'use strict';

const parseLinkHeader = require( 'li' ).parse;

/**
 * Attempt to locate a `rel="https://api.w.org"` link relation header
 *
 * @method locateAPIRootHeader
 * @param {Object} response A response object with a link or headers property
 * @returns {String} The URL of the located API root
 */
function locateAPIRootHeader( response ) {
	// See https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/
	const rel = 'https://api.w.org/';

	// Extract & parse the response link headers
	const link = response.link || ( response.headers && response.headers.link );
	const headers = parseLinkHeader( link );

	const apiHeader = headers && headers[ rel ];

	if ( apiHeader ) {
		return apiHeader;
	}

	throw new Error( `No header link found with rel="${ rel }"` );
}

module.exports = {
	locateAPIRootHeader: locateAPIRootHeader,
};
