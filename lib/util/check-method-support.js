'use strict';

/**
 * Verify that a specific HTTP method is supported by the provided WPRequest
 *
 * @param {String} method An HTTP method to check ('get', 'post', etc)
 * @param {WPRequest} request A WPRequest object with a _supportedMethods array
 * @return true iff the method is within request._supportedMethods
 */
module.exports = function( method, request ) {
	if ( request._supportedMethods.indexOf( method.toLowerCase() ) === -1 ) {
		throw new Error(
			'Unsupported method; supported methods are: ' +
			request._supportedMethods.join( ', ' )
		);
	}

	return true;
};
