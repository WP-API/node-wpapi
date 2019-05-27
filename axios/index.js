const WPAPI = require( '../wpapi' );
const axiosTransport = require( './axios-transport' );
const bindTransport = require( '../lib/bind-transport' );

// Bind the axios-based HTTP transport to the WPAPI constructor
module.exports = bindTransport( WPAPI, axiosTransport );
