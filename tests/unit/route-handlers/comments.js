'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.comments', () => {
	let site;
	let comments;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		comments = site.comments();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			comments = site.comments( {
				endpoint: '/custom-endpoint/',
			} );
			expect( comments._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( comments._options.endpoint ).toBe( '/wp-json/' );
			expect( comments._options.username ).toBe( 'foouser' );
			expect( comments._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( comments.toString() ).toBe( '/wp-json/wp/v2/comments' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( comments ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( comments._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit CommentsRequest from WPRequest', () => {
			expect( comments instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( 'path part setters', () => {

		describe( '.id()', () => {

			it( 'provides a method to set the ID', () => {
				expect( comments ).toHaveProperty( 'id' );
				expect( typeof comments.id ).toBe( 'function' );
			} );

			it( 'should set the ID value in the path', () => {
				comments.id( 314159 );
				expect( comments.toString() ).toBe( '/wp-json/wp/v2/comments/314159' );
			} );

			it( 'accepts ID parameters as strings', () => {
				comments.id( '8' );
				expect( comments.toString() ).toBe( '/wp-json/wp/v2/comments/8' );
			} );

			it( 'should update the supported methods when setting ID', () => {
				comments.id( 8 );
				const _supportedMethods = comments._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).toBe( 'delete|get|head|patch|post|put' );
			} );

		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all comments', () => {
			const path = comments.toString();
			expect( path ).toBe( '/wp-json/wp/v2/comments' );
		} );

		it( 'should create the URL for retrieving a specific comment', () => {
			const path = comments.id( 1337 ).toString();
			expect( path ).toBe( '/wp-json/wp/v2/comments/1337' );
		} );

		it( 'does not throw an error if a valid numeric ID is specified', () => {
			expect( () => {
				comments.id( 8 );
				comments.validatePath();
			} ).not.toThrow();
		} );

		it( 'does not throw an error if a valid numeric ID is specified as a string', () => {
			expect( () => {
				comments.id( '8' );
				comments.validatePath();
			} ).not.toThrow();
		} );

		it( 'throws an error if a non-integer numeric string ID is specified', () => {
			expect( () => {
				comments.id( 4.019 );
				comments.validatePath();
			} ).toThrow();
		} );

		it( 'throws an error if a non-numeric string ID is specified', () => {
			expect( () => {
				comments.id( 'wombat' );
				comments.validatePath();
			} ).toThrow();
		} );

		it( 'should restrict path changes to a single instance', () => {
			comments.id( 2 );
			const newComments = site.comments().id( 3 );
			expect( comments.toString() ).toBe( '/wp-json/wp/v2/comments/2' );
			expect( newComments.toString() ).toBe( '/wp-json/wp/v2/comments/3' );
		} );

	} );

} );
