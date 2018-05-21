'use strict';
var expect = require( 'chai' ).expect;

var autodiscovery = require( '../../../lib/autodiscovery' );

describe( 'autodiscovery helper methods', () => {

	describe( '.locateAPIRootHeader()', () => {
		var locateAPIRootHeader;

		beforeEach( () => {
			locateAPIRootHeader = autodiscovery.locateAPIRootHeader;
		});

		it( 'is a function', () => {
			expect( locateAPIRootHeader ).to.be.a( 'function' );
		});

		it( 'throws an error if no link header is found', () => {
			expect( () => {
				locateAPIRootHeader({
					headers: {}
				});
			}).to.throw( 'No header link found with rel="https://api.w.org/"' );
		});

		it( 'parsed and returns the header with the rel for the REST API endpoint', () => {
			var result = locateAPIRootHeader({
				headers: {
					link: '<http://wpapi.loc/wp-json/>; rel="https://api.w.org/"'
				}
			});
			expect( result ).to.equal( 'http://wpapi.loc/wp-json/' );
		});

	});

});
