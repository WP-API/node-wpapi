'use strict';
const { expect } = require( 'chai' );

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
			expect( taxonomies._options.endpoint ).to.equal( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( taxonomies._options.endpoint ).to.equal( '/wp-json/' );
			expect( taxonomies._options.username ).to.equal( 'foouser' );
			expect( taxonomies._options.password ).to.equal( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( taxonomies.toString() ).to.equal( '/wp-json/wp/v2/taxonomies' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( taxonomies ).to.have.property( '_supportedMethods' );
			expect( taxonomies._supportedMethods ).to.be.an( 'array' );
		} );

		it( 'should inherit TaxonomiesRequest from WPRequest', () => {
			expect( taxonomies instanceof WPRequest ).to.be.true;
		} );

	} );

	describe( 'path part setters', () => {

		describe( '.taxonomy()', () => {

			it( 'provides a method to set the taxonomy', () => {
				expect( taxonomies ).to.have.property( 'taxonomy' );
				expect( taxonomies.taxonomy ).to.be.a( 'function' );
			} );

		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all taxonomies', () => {
			const url = taxonomies.toString();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies' );
		} );

		it( 'should create the URL for retrieving a specific taxonomy', () => {
			const url = taxonomies.taxonomy( 'category' ).toString();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies/category' );
		} );

	} );

} );
