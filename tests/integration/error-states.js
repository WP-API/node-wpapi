'use strict';

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	// TODO: Reinstate once invalid route handling is supported properly in fetch transport
	// [ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: error states:', ( transportName, WPAPI ) => {

	it( 'invalid root endpoint causes a transport-level (superagent) 404 error', () => {
		const wp = WPAPI.site( 'http://wpapi.local/wrong-root-endpoint' );
		const prom = wp.posts()
			.get()
			.catch( ( err ) => {
				expect( err ).toBeInstanceOf( Error );
				expect( err ).toHaveProperty( 'status' );
				expect( err.status ).toBe( 404 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
