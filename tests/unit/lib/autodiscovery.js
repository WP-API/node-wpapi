'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
chai.use( require( 'chai-as-promised' ) );

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'bluebird' );

var autodiscovery = require( '../../../lib/autodiscovery' );

describe( 'autodiscovery methods', function() {

	describe( '.resolveAsPromise()', function() {
		var resolveAsPromise;
		var err;
		var res;
		var mockAgent;

		beforeEach(function() {
			resolveAsPromise = autodiscovery.resolveAsPromise;

			// Default return values for the mock agent
			err = null;
			res = 'Response';

			// Mock superagent
			mockAgent = {
				end: function( cb ) {
					cb( err, res );
				}
			};
		});

		it( 'is a function', function() {
			expect( resolveAsPromise ).to.be.a( 'function' );
		});

		it( 'returns a promise', function() {
			var prom = resolveAsPromise( mockAgent );
			expect( prom ).to.be.an.instanceOf( Promise );
		});

		it( 'resolves the promise with the response from the agent end method', function() {
			var prom = resolveAsPromise( mockAgent );
			return expect( prom ).to.eventually.equal( 'Response' );
		});

		it( 'rejects if the agent end method is called with an error', function() {
			err = 'Some error';
			var prom = resolveAsPromise( mockAgent );
			return expect( prom ).to.eventually.be.rejectedWith( 'Some error' );
		});

		it( 'rejects with the error\'s response.error property when available', function() {
			err = {
				response: {
					error: '404 yo'
				}
			};
			var prom = resolveAsPromise( mockAgent );
			return expect( prom ).to.eventually.be.rejectedWith( '404 yo' );
		});

	});

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

		it( 'parsed and returns the header with the rel for the WP api endpoint', function() {
			var result = locateAPIRootHeader({
				headers: {
					link: '<http://wpapi.loc/wp-json/>; rel="https://api.w.org/"'
				}
			});
			expect( result ).to.equal( 'http://wpapi.loc/wp-json/' );
		});

	});

});
