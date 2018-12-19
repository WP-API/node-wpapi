'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.taxonomies', () => {
	let site;
	let taxonomies;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		taxonomies = site.taxonomies();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			taxonomies = site.taxonomies( {
				endpoint: '/custom-endpoint/',
			} );
			expect( taxonomies._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( taxonomies._options.endpoint ).toBe( '/wp-json/' );
			expect( taxonomies._options.username ).toBe( 'foouser' );
			expect( taxonomies._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( taxonomies.toString() ).toBe( '/wp-json/wp/v2/taxonomies' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( taxonomies ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( taxonomies._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit TaxonomiesRequest from WPRequest', () => {
			expect( taxonomies instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( 'path part setters', () => {

		describe( '.taxonomy()', () => {

			it( 'provides a method to set the taxonomy', () => {
				expect( taxonomies ).toHaveProperty( 'taxonomy' );
				expect( typeof taxonomies.taxonomy ).toBe( 'function' );
			} );

		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all taxonomies', () => {
			const url = taxonomies.toString();
			expect( url ).toBe( '/wp-json/wp/v2/taxonomies' );
		} );

		it( 'should create the URL for retrieving a specific taxonomy', () => {
			const url = taxonomies.taxonomy( 'category' ).toString();
			expect( url ).toBe( '/wp-json/wp/v2/taxonomies/category' );
		} );

	} );

} );
