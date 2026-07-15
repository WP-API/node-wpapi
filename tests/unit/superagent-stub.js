'use strict';

describe( 'wpapi/superagent', () => {

	it( 'throws an error directing consumers to the fetch-based default export', () => {
		expect( () => require( '../../superagent' ) ).toThrow( /wpapi\/superagent was removed in wpapi 2.0.0/ );
	} );

} );
