'use strict';
const chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
const expect = chai.expect;

const WPAPI = require( '../../' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( './helpers/get-rendered-prop' ).bind( null, 'title' );
const base64credentials = new Buffer( 'apiuser:password' ).toString( 'base64' );

describe( 'integration: custom HTTP Headers', () => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	// Testing basic authentication is an acceptable proxy for whether a header
	// value (Authentication:, in this case) is being set
	it( 'can be provided using WPRequest#setHeaders()', () => {
		const prom = wp.posts()
			.setHeaders( 'Authorization', 'Basic ' + base64credentials )
			.status([ 'future', 'draft' ])
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).to.deep.equal([
					'Scheduled',
					'Draft'
				]);
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can be provided at the WPAPI instance level using WPAPI#setHeaders()', () => {
		const authenticated = WPAPI
			.site( 'http://wpapi.loc/wp-json' )
			.setHeaders( 'Authorization', 'Basic ' + base64credentials );
		const prom = authenticated.posts()
			.status([ 'future', 'draft' ])
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).to.deep.equal([
					'Scheduled',
					'Draft'
				]);
				return authenticated.users().me();
			})
			.then( ( me ) => {
				expect( me.slug ).to.equal( 'apiuser' );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

});
