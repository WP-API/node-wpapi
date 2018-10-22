'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WPAPI = require( '../../' );

describe( 'error states:', () => {

	it( 'invalid root endpoint causes a transport-level (superagent) 404 error', () => {
		var wp = WPAPI.site( 'http://wpapi.local/wrong-root-endpoint' );
		var prom = wp.posts()
			.get()
			.catch( ( err ) => {
				expect( err ).to.be.an.instanceOf( Error );
				expect( err ).to.have.property( 'status' );
				expect( err.status ).to.equal( 404 );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

});
