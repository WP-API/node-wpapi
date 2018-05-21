'use strict';
const chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
chai.use( require( 'sinon-chai' ) );
const expect = chai.expect;
const sinon = require( 'sinon' );

const WPAPI = require( '../../' );
const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( './helpers/get-rendered-prop' ).bind( null, 'title' );
const credentials = require( './helpers/constants' ).credentials;

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
const expectedResults = {
	firstPostTitle: 'Markup: HTML Tags and Formatting'
};

describe( 'integration: discover()', () => {
	let apiPromise;
	let sinonSandbox;

	beforeEach( () => {
		apiPromise = WPAPI.discover( 'http://wpapi.loc' );
		// Stub warn and error
		sinonSandbox = sinon.sandbox.create();
		sinonSandbox.stub( global.console, 'warn' );
		sinonSandbox.stub( global.console, 'error' );
	});

	afterEach( () => {
		// Restore sandbox
		sinonSandbox.restore();
	});

	it( 'returns a promise', () => {
		const Promise = require( 'es6-promise' );
		expect( apiPromise ).to.be.an.instanceOf( Promise );
	});

	it( 'eventually returns a configured WP instance', () => {
		const prom = apiPromise
			.then( ( result ) => {
				expect( result ).to.be.an.instanceOf( WPAPI );
				expect( result.namespace( 'wp/v2' ) ).to.be.an( 'object' );
				expect( result.posts ).to.be.a( 'function' );
				expect( result.posts() ).to.be.an.instanceOf( WPRequest );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'auto-binds to the detected endpoint on the provided site', () => {
		const prom = apiPromise
			.then( ( site ) => {
				expect( site.posts().toString() ).to.equal( 'http://wpapi.loc/wp-json/wp/v2/posts' );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can correctly instantiate requests against the detected and bound site', () => {
		const prom = apiPromise
			.then( ( site ) => site.posts() )
			.then( ( posts ) => {
				expect( getTitles( posts )[ 0 ] ).to.equal( expectedResults.firstPostTitle );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'can authenticate', () => {

		it( 'requests against the detected and bound site', () => {
			const prom = apiPromise
				.then( ( site ) => site.auth( credentials ) )
				.then( ( site ) => site.users().me() )
				.then( ( user ) => {
					expect( user ).to.be.an( 'object' );
					expect( user.slug ).to.equal( credentials.username );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'one-off requests against the detected and bound site', () => {
			const prom = apiPromise
				.then( ( site ) => site.users().auth( credentials ).me() )
				.then( ( user ) => {
					expect( user ).to.be.an( 'object' );
					expect( user.slug ).to.equal( credentials.username );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

});
