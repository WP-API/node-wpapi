const WPAPI = require( '../wpapi' );

// Pull in superagent-based HTTP transport
const httpTransport = require( './http-transport' );

/**
 * The HTTP transport methods object used by all WPAPI instances
 *
 * These methods may be extended or replaced on an instance-by-instance basis
 *
 * @memberof! WPAPI
 * @static
 * @property transport
 * @type {Object}
 */
WPAPI.transport = Object.create( httpTransport );
Object.freeze( WPAPI.transport );

module.exports = WPAPI;
