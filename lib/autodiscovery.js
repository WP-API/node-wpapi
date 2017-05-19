/**
 * Utility methods used when querying a site in order to discover its available
 * API endpoints
 *
 * @module autodiscovery
 */
'use strict';

var parseLinkHeader = require( 'parse-link-header' );

/**
 * Attempt to locate a `rel="https://api.w.org"` link relation header
 *
 * @method locateAPIRootHeader
 * @param {Object} response A response object with a link or headers property
 * @returns {String} The URL of the located API root
 */
function locateAPIRootHeader( response ) {
	// Define the expected link rel value per http://v2.wp-api.org/guide/discovery/
	var rel = 'https://api.w.org/';

	// Extract & parse the response link headers
	var link = response.link || ( response.headers && response.headers.link );
	var headers = parseLinkHeader( link );
	var apiHeader = headers && headers[ rel ];

	if ( apiHeader && apiHeader.url ) {
		return apiHeader.url;
	}

	throw new Error( 'No header link found with rel="https://api.w.org/"' );
}

module.exports = {
	locateAPIRootHeader: locateAPIRootHeader
};
