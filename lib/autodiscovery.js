/**
 * Utility methods used to query a site in order to discover its available
 * API endpoints
 *
 * @module autodiscovery
 */
'use strict';

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'bluebird' );
var agent = require( 'superagent' );
var parseLinkHeader = require( 'parse-link-header' );

function resolveAsPromise( superagentReq ) {
	return new Promise(function( resolve, reject ) {
		superagentReq.end(function( err, res ) {
			if ( err ) {
				// If err.response is present, the request succeeded but we got an
				// error from the server: surface & return that error
				if ( err.response && err.response.error ) {
					return reject( err.response.error );
				}
				// If err.response is not present, the request could not connect
				return reject( err );
			}
			resolve( res );
		});
	});
}

/**
 * Fetch the headers for a URL and inspect them to attempt to locate an API
 * endpoint header. Return a promise that will be resolved with a string, or
 * rejected if no such header can be located.
 *
 * @param {string}  url      An arbitrary URL within an API-enabled WordPress site
 * @param {boolean} [useGET] Whether to use GET or HEAD to read the URL, to enable
 *                           the method to upgrade to a full GET request if a HEAD
 *                           request initially fails.
 * @returns {Promise} A promise to the string containing the API endpoint URL
 */
function getAPIRootFromURL( url, useGET ) {

	// If useGET is specified and truthy, .get the url; otherwise use .head
	// because we only care about the HTTP headers, not the response body.
	var request = useGET ? agent.get( url ) : agent.head( url );

	return resolveAsPromise( request )
		.catch(function( err ) {
			// If this wasn't already a GET request, then on the hypothesis that an
			// error arises from an unaccepted HEAD request, try again using GET
			if ( ! useGET ) {
				return getAPIRootFromURL( url, true );
			}

			// Otherwise re-throw the error
			throw err;
		});
}

function locateAPIRootHeader( response ) {
	var rel = 'https://api.w.org/';

	// Extract & parse the response link headers
	var headers = parseLinkHeader( response.headers.link );
	var apiHeader = headers && headers[ rel ];

	if ( apiHeader && apiHeader.url ) {
		return apiHeader.url;
	}

	throw new Error( 'No header link found with rel="https://api.w.org/"' );
}

/**
 * Function to be called with the API url, once we have found one
 *
 * @param  {String} linkUrl The href of the <link> pointing to the API root
 * @return {Promise} Promise that resolves once the API root has been inspected
 */
function getRootResponseJSON( apiRootURL ) {
	return resolveAsPromise( agent.get( apiRootURL ).set( 'Accept', 'application/json' ) )
		.then(function( response ) {
			return response.body;
		});
}

module.exports = {
	resolveAsPromise: resolveAsPromise,
	getAPIRootFromURL: getAPIRootFromURL,
	locateAPIRootHeader: locateAPIRootHeader,
	getRootResponseJSON: getRootResponseJSON
};
