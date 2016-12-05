'use strict';
var expect = require( 'chai' ).expect;

var autodiscovery = require( '../../../lib/autodiscovery' );

describe( 'autodiscovery helper methods', function() {

	describe( '.locateAPIRootHeader()', function() {
		var locateAPIRootHeader;

		beforeEach(function() {
			locateAPIRootHeader = autodiscovery.locateAPIRootHeader;
		});

		it( 'is a function', function() {
			expect( locateAPIRootHeader ).to.be.a( 'function' );
		});

		it( 'throws an error if no link header is found', function() {
			expect(function() {
				locateAPIRootHeader({
					headers: {}
				});
			}).to.throw( 'No header link found with rel="https://api.w.org/"' );
		});

		it( 'parsed and returns the header with the rel for the REST API endpoint', function() {
			var result = locateAPIRootHeader({
				headers: {
					link: '<http://wpapi.loc/wp-json/>; rel="https://api.w.org/"'
				}
			});
			expect( result ).to.equal( 'http://wpapi.loc/wp-json/' );
		});

	});

});
