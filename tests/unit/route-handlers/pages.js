'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.pages', () => {
	let site;
	let pages;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		pages = site.pages();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			pages = site.pages( {
				endpoint: '/custom-endpoint/',
			} );
			expect( pages._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( pages._options.endpoint ).toBe( '/wp-json/' );
			expect( pages._options.username ).toBe( 'foouser' );
			expect( pages._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( pages.toString() ).toBe( '/wp-json/wp/v2/pages' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( pages ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( pages._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit PagesRequest from WPRequest', () => {
			expect( pages instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( 'URL Generation', () => {

		it( 'should restrict path changes to a single instance', () => {
			pages.id( 2 );
			const newPages = site.pages().id( 3 ).revisions();
			expect( pages.toString() ).toBe( '/wp-json/wp/v2/pages/2' );
			expect( newPages.toString() ).toBe( '/wp-json/wp/v2/pages/3/revisions' );
		} );

		describe( 'page collections', () => {

			it( 'should create the URL for retrieving all pages', () => {
				expect( pages.toString() ).toBe( '/wp-json/wp/v2/pages' );
			} );

			it( 'should provide filtering methods', () => {
				expect( typeof pages.slug ).toBe( 'function' );
				const path = pages.slug( 'some-slug' ).toString();
				expect( path ).toBe( '/wp-json/wp/v2/pages?slug=some-slug' );
			} );

		} );

		describe( '.id()', () => {

			it( 'is defined', () => {
				expect( pages ).toHaveProperty( 'id' );
				expect( typeof pages.id ).toBe( 'function' );
			} );

			it( 'should create the URL for retrieving a specific post', () => {
				const path = pages.id( 1337 ).toString();
				expect( path ).toBe( '/wp-json/wp/v2/pages/1337' );
			} );

			it( 'should update the supported methods when setting ID', () => {
				pages.id( 8 );
				const _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).toBe( 'delete|get|head|patch|post|put' );
			} );

		} );

		describe( '.revisions()', () => {

			it( 'is defined', () => {
				expect( pages ).toHaveProperty( 'revisions' );
			} );

			it( 'is a function', () => {
				expect( typeof pages.revisions ).toBe( 'function' );
			} );

			it( 'should create the URL for retrieving the revisions for a specific post', () => {
				const path = pages.id( 1337 ).revisions().toString();
				expect( path ).toBe( '/wp-json/wp/v2/pages/1337/revisions' );
			} );

		} );

	} );

} );
