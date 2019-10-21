'use strict';

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( '../helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( '../helpers/constants' ).credentials;

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
const expectedResults = {
	firstPostTitle: 'Markup: HTML Tags and Formatting',
};

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: discover', ( transportName, WPAPI ) => {
	let apiPromise;

	beforeAll( () => {
		apiPromise = WPAPI.discover( 'http://wpapi.local' );
		// Stub warn and error
		jest.spyOn( global.console, 'warn' ).mockImplementation( () => {} );
		jest.spyOn( global.console, 'error' ).mockImplementation( () => {} );
	} );

	it( 'returns a promise', () => {
		expect( apiPromise ).toBeInstanceOf( Promise );
	} );

	it( 'eventually returns a configured WP instance', () => {
		const prom = apiPromise
			.then( ( result ) => {
				expect( result ).toBeInstanceOf( WPAPI );
				expect( typeof result.namespace( 'wp/v2' ) ).toBe( 'object' );
				expect( typeof result.posts ).toBe( 'function' );
				expect( result.posts() ).toBeInstanceOf( WPRequest );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'auto-binds to the detected endpoint on the provided site', () => {
		const prom = apiPromise
			.then( ( site ) => {
				expect( site.posts().toString() ).toBe( 'http://wpapi.local/wp-json/wp/v2/posts' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'resolves to correct endpoint if discovery targets /wp-json', () => {
		const prom = WPAPI.discover( 'http://wpapi.local/wp-json' )
			.then( ( site ) => {
				expect( site.posts().toString() ).toBe( 'http://wpapi.local/wp-json/wp/v2/posts' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'resolves to correct endpoint if discovery targets ?rest_route=/', () => {
		const prom = WPAPI.discover( 'http://wpapi.local/?rest_route=/' )
			.then( ( site ) => {
				expect( site.posts().toString() ).toBe( 'http://wpapi.local/wp-json/wp/v2/posts' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can correctly instantiate requests against the detected and bound site', () => {
		const prom = apiPromise
			.then( site => site.posts() )
			.then( ( posts ) => {
				expect( getTitles( posts )[ 0 ] ).toBe( expectedResults.firstPostTitle );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'can authenticate', () => {

		it( 'requests against the detected and bound site', () => {
			const prom = apiPromise
				.then( site => site.auth( credentials ) )
				.then( site => site.users().me() )
				.then( ( user ) => {
					expect( typeof user ).toBe( 'object' );
					expect( user.slug ).toBe( credentials.username );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'one-off requests against the detected and bound site', () => {
			const prom = apiPromise
				.then( site => site.users().auth( credentials ).me() )
				.then( ( user ) => {
					expect( typeof user ).toBe( 'object' );
					expect( user.slug ).toBe( credentials.username );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
