const WPAPI = require( '../wpapi' );
const fetchTransport = require( './fetch-transport' );
const bindTransport = require( '../lib/bind-transport' );

// Bind the fetch-based HTTP transport to the WPAPI constructor
module.exports = bindTransport( WPAPI, fetchTransport );
