'use strict';
const { expect } = require( 'chai' );

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.posts', () => {
	let site;
	let posts;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		posts = site.posts();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			posts = site.posts( {
				endpoint: '/custom-endpoint/',
			} );
			expect( posts._options.endpoint ).to.equal( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( posts._options.endpoint ).to.equal( '/wp-json/' );
			expect( posts._options.username ).to.equal( 'foouser' );
			expect( posts._options.password ).to.equal( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( posts.toString() ).to.equal( '/wp-json/wp/v2/posts' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( posts ).to.have.property( '_supportedMethods' );
			expect( posts._supportedMethods ).to.be.an( 'array' );
		} );

		it( 'should inherit PostsRequest from WPRequest', () => {
			expect( posts instanceof WPRequest ).to.be.true;
		} );

	} );

	describe( 'path part setters', () => {

		describe( '.id()', () => {

			it( 'provides a method to set the ID', () => {
				expect( posts ).to.have.property( 'id' );
				expect( posts.id ).to.be.a( 'function' );
			} );

			it( 'should set the ID value in the path', () => {
				posts.id( 314159 );
				expect( posts.toString() ).to.equal( '/wp-json/wp/v2/posts/314159' );
			} );

			it( 'accepts ID parameters as strings', () => {
				posts.id( '8' );
				expect( posts.toString() ).to.equal( '/wp-json/wp/v2/posts/8' );
			} );

			it( 'should update the supported methods when setting ID', () => {
				posts.id( 8 );
				const _supportedMethods = posts._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			} );

		} );

	} );

	it( 'provides expected filter methods', () => {
		[
			'after',
			'before',
			'categories',
			'include',
			'order',
			'page',
			'slug',
			'password',
			'status',
			'sticky',
		].forEach( ( methodName ) => {
			expect( posts ).to.have.property( methodName );
			expect( posts[ methodName ] ).to.be.a( 'function' );
		} );
	} );

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all posts', () => {
			const path = posts.toString();
			expect( path ).to.equal( '/wp-json/wp/v2/posts' );
		} );

		it( 'should create the URL for retrieving a specific post', () => {
			const path = posts.id( 1337 ).toString();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337' );
		} );

		it( 'does not throw an error if a valid numeric ID is specified', () => {
			expect( () => {
				posts.id( 8 );
				posts.validatePath();
			} ).not.to.throw();
		} );

		it( 'does not throw an error if a valid numeric ID is specified as a string', () => {
			expect( () => {
				posts.id( '8' );
				posts.validatePath();
			} ).not.to.throw();
		} );

		it( 'throws an error if a non-integer numeric string ID is specified', () => {
			expect( () => {
				posts.id( 4.019 );
				posts.validatePath();
			} ).to.throw();
		} );

		it( 'throws an error if a non-numeric string ID is specified', () => {
			expect( () => {
				posts.id( 'wombat' );
				posts.validatePath();
			} ).to.throw();
		} );

		it( 'should create the URL for retrieving the revisions for a specific post', () => {
			const path = posts.id( 1337 ).revisions().toString();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/revisions' );
		} );

		it( 'should create the URL for retrieving a specific revision item', () => {
			const path = posts.id( 1337 ).revisions( 2001 ).toString();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/revisions/2001' );
		} );

		it( 'should restrict path changes to a single instance', () => {
			posts.id( 2 );
			const newPosts = site.posts().id( 3 ).revisions();
			expect( posts.toString() ).to.equal( '/wp-json/wp/v2/posts/2' );
			expect( newPosts.toString() ).to.equal( '/wp-json/wp/v2/posts/3/revisions' );
		} );

	} );

} );
