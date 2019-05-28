'use strict';

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( '../helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( '../helpers/constants' ).credentials;
const base64credentials = Buffer.from( `${ credentials.username }:${ credentials.password }` ).toString( 'base64' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: custom HTTP Headers', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	// Testing basic authentication is an acceptable proxy for whether a header
	// value (Authentication:, in this case) is being set
	it( 'can be provided using WPRequest#setHeaders()', () => {
		const prom = wp.posts()
			.setHeaders( 'Authorization', 'Basic ' + base64credentials )
			.status( [ 'future', 'draft' ] )
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).toEqual( [
					'Scheduled',
					'Draft',
				] );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be provided at the WPAPI instance level using WPAPI#setHeaders()', () => {
		const authenticated = WPAPI
			.site( 'http://wpapi.local/wp-json' )
			.setHeaders( 'Authorization', 'Basic ' + base64credentials );
		const prom = authenticated.posts()
			.status( [ 'future', 'draft' ] )
			.get()
			.then( ( posts ) => {
				expect( getTitles( posts ) ).toEqual( [
					'Scheduled',
					'Draft',
				] );
				return authenticated.users().me();
			} )
			.then( ( me ) => {
				expect( me.slug ).toBe( 'admin' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
