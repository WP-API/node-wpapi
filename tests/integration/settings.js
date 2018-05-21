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

const credentials = require( './helpers/constants' ).credentials;

describe( 'integration: settings()', () => {
	let wp;
	let authenticated;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.loc/wp-json'
		} );
		authenticated = new WPAPI( {
			endpoint: 'http://wpapi.loc/wp-json'
		} ).auth( credentials );
	} );

	it( 'cannot be used to retrieve site settings unless authenticated', () => {
		const prom = wp.settings()
			.get()
			.catch( ( err ) => {
				expect( err.code ).to.equal( 'rest_forbidden' );
				expect( err.data ).to.deep.equal( {
					status: 401
				} );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'can be used to retrieve a list of site settings when authenticated', () => {
		const prom = authenticated.settings()
			.get()
			.then( ( settings ) => {
				expect( settings ).to.be.an( 'object' );

				// Validate existence of all expected keys
				expect( Object.keys( settings ).sort() ).to.deep.equal( [
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
					'use_smilies'
				] );

				// Spot check specific values
				expect( settings.title ).to.equal( 'WP-API Testbed' );
				expect( settings.description ).to.equal( 'Just another WordPress site' );
				expect( settings.language ).to.equal( 'en_US' );
				expect( settings.posts_per_page ).to.equal( 10 );

				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'can be used to update settings', () => {
		const prom = authenticated.settings()
			.get()
			.then( ( settings ) => {
				expect( settings.description ).to.equal( 'Just another WordPress site' );
				return authenticated.settings()
					.update( {
						description: 'It\'s amazing what you\'ll find face to face'
					} );
			} )
			// Initialize new request to see if changes persisted
			.then( () => authenticated.settings().get() )
			.then( ( settings ) => {
				expect( settings.description ).to.equal( 'It&#039;s amazing what you&#039;ll find face to face' );
				// Reset to original value
				return authenticated.settings()
					.update( {
						description: 'Just another WordPress site'
					} );
			} )
			// Request one final time to validate value has been set back
			.then( () => authenticated.settings().get() )
			.then( ( settings ) => {
				expect( settings.description ).to.equal( 'Just another WordPress site' );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

} );
