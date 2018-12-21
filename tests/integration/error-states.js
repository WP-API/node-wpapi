'use strict';

const WPAPI = require( '../../superagent' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe( 'error states:', () => {

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
