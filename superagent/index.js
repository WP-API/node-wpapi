const WPAPI = require( '../wpapi' );

// Pull in default HTTP transport
const httpTransport = require( '../lib/http-transport' );

/**
 * Default HTTP transport methods object for all WPAPI instances
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
