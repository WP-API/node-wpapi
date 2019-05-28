'use strict';

const credentials = require( '../helpers/constants' ).credentials;

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: settings()', ( transportName, WPAPI ) => {
	let wp;
	let authenticated;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
		authenticated = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} ).auth( credentials );
	} );

	it( 'cannot be used to retrieve site settings unless authenticated', () => {
		const prom = wp.settings()
			.get()
			.catch( ( err ) => {
				expect( err.code ).toBe( 'rest_forbidden' );
				expect( err.data ).toEqual( {
					status: 401,
				} );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be used to retrieve a list of site settings when authenticated', () => {
		const prom = authenticated.settings()
			.get()
			.then( ( settings ) => {
				expect( typeof settings ).toBe( 'object' );

				// Validate existence of all expected keys
				expect( Object.keys( settings ).sort() ).toEqual( [
					'date_format',
					'default_category',
					'default_comment_status',
					'default_ping_status',
					'default_post_format',
					'description',
					'email',
					'language',
					'posts_per_page',
					'start_of_week',
					'time_format',
					'timezone',
					'title',
					'url',
					'use_smilies',
				] );

				// Spot check specific values
				expect( settings.title ).toBe( 'WP-API Testbed' );
				expect( settings.description ).toBe( 'Just another WordPress site' );
				expect( settings.posts_per_page ).toBe( 10 );

				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be used to update settings', () => {
		const prom = authenticated.settings()
			.get()
			.then( ( settings ) => {
				expect( settings.description ).toBe( 'Just another WordPress site' );
				return authenticated.settings()
					.update( {
						description: 'It\'s amazing what you\'ll find face to face',
					} );
			} )
			// Initialize new request to see if changes persisted
			.then( () => authenticated.settings().get() )
			.then( ( settings ) => {
				expect( settings.description ).toBe( 'It&#039;s amazing what you&#039;ll find face to face' );
				// Reset to original value
				return authenticated.settings()
					.update( {
						description: 'Just another WordPress site',
					} );
			} )
			// Request one final time to validate value has been set back
			.then( () => authenticated.settings().get() )
			.then( ( settings ) => {
				expect( settings.description ).toBe( 'Just another WordPress site' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
