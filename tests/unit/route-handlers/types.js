'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.types', () => {
	let site;
	let types;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		types = site.types();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			types = site.types( {
				endpoint: '/custom-endpoint/',
			} );
			expect( types._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( types._options.endpoint ).toBe( '/wp-json/' );
			expect( types._options.username ).toBe( 'foouser' );
			expect( types._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( types.toString() ).toBe( '/wp-json/wp/v2/types' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( types ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( types._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit PostsRequest from WPRequest', () => {
			expect( types instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all types', () => {
			const url = types.toString();
			expect( url ).toBe( '/wp-json/wp/v2/types' );
		} );

		it( 'should create the URL for retrieving a specific term', () => {
			const url = types.type( 'some_type' ).toString();
			expect( url ).toBe( '/wp-json/wp/v2/types/some_type' );
		} );

	} );

} );
