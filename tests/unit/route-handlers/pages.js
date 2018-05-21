'use strict';
const { expect } = require( 'chai' );

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.pages', () => {
	let site;
	let pages;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		} );
		pages = site.pages();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			pages = site.pages( {
				endpoint: '/custom-endpoint/'
			} );
			expect( pages._options.endpoint ).to.equal( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( pages._options.endpoint ).to.equal( '/wp-json/' );
			expect( pages._options.username ).to.equal( 'foouser' );
			expect( pages._options.password ).to.equal( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( pages ).to.have.property( '_supportedMethods' );
			expect( pages._supportedMethods ).to.be.an( 'array' );
		} );

		it( 'should inherit PagesRequest from WPRequest', () => {
			expect( pages instanceof WPRequest ).to.be.true;
		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should restrict path changes to a single instance', () => {
			pages.id( 2 );
			const newPages = site.pages().id( 3 ).revisions();
			expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages/2' );
			expect( newPages.toString() ).to.equal( '/wp-json/wp/v2/pages/3/revisions' );
		} );

		describe( 'page collections', () => {

			it( 'should create the URL for retrieving all pages', () => {
				expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages' );
			} );

			it( 'should provide filtering methods', () => {
				expect( pages ).to.have.property( 'slug' );
				expect( pages.slug ).to.be.a( 'function' );
				const path = pages.slug( 'some-slug' ).toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages?slug=some-slug' );
			} );

		} );

		describe( '.id()', () => {

			it( 'is defined', () => {
				expect( pages ).to.have.property( 'id' );
				expect( pages.id ).to.be.a( 'function' );
			} );

			it( 'should create the URL for retrieving a specific post', () => {
				const path = pages.id( 1337 ).toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337' );
			} );

			it( 'should update the supported methods when setting ID', () => {
				pages.id( 8 );
				const _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			} );

		} );

		describe( '.revisions()', () => {

			it( 'is defined', () => {
				expect( pages ).to.have.property( 'revisions' );
			} );

			it( 'is a function', () => {
				expect( pages.revisions ).to.be.a( 'function' );
			} );

			it( 'should create the URL for retrieving the revisions for a specific post', () => {
				const path = pages.id( 1337 ).revisions().toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/revisions' );
			} );

		} );

	} );

} );
