/**
 * Utility method for binding a frozen transport object to the WPAPI constructor
 *
 * See /axios and /superagent directories
 * @param {Function} WPAPI         The WPAPI constructor
 * @param {Object}   httpTransport The HTTP transport object
 * @returns {Function} The WPAPI object augmented with the provided transport
 */
module.exports = function( WPAPI, httpTransport ) {
	WPAPI.transport = Object.create( httpTransport );
	Object.freeze( WPAPI.transport );
	return WPAPI;
};
