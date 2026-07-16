import WPAPI = require( '../wpapi' );
import fetchTransport = require( './fetch-transport' );
import bindTransport = require( '../lib/bind-transport' );

// Bind the fetch-based HTTP transport to the WPAPI constructor
export = bindTransport( WPAPI, fetchTransport );
