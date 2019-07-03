const WPAPI = require( '../wpapi' );
const superagentTransport = require( './superagent-transport' );
const bindTransport = require( '../lib/bind-transport' );

// Bind the superagent-based HTTP transport to the WPAPI constructor
module.exports = bindTransport( WPAPI, superagentTransport );
