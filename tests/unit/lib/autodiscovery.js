'use strict';

const autodiscovery = require( '../../../lib/autodiscovery' );

describe( 'autodiscovery helper methods', () => {

	describe( '.locateAPIRootHeader()', () => {
		let locateAPIRootHeader;

		beforeEach( () => {
			locateAPIRootHeader = autodiscovery.locateAPIRootHeader;
		} );

		it( 'is a function', () => {
			expect( typeof locateAPIRootHeader ).toBe( 'function' );
		} );

		it( 'throws an error if no link header is found', () => {
			expect( () => {
				locateAPIRootHeader( {
					headers: {},
				} );
			} ).toThrow( 'No header link found with rel="https://api.w.org/"' );
		} );

		it( 'parsed and returns the header with the rel for the REST API endpoint', () => {
			const result = locateAPIRootHeader( {
				headers: {
					link: '<http://wpapi.local/wp-json/>; rel="https://api.w.org/"',
				},
			} );
			expect( result ).toBe( 'http://wpapi.local/wp-json/' );
		} );

	} );

} );
