'use strict';
var expect = require( 'chai' ).expect;

var WPAPI = require( '../../../wpapi' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.pages', function() {
	var site;
	var pages;

	beforeEach(function() {
		site = new WPAPI({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		pages = site.pages();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			pages = site.pages({
				endpoint: '/custom-endpoint/'
			});
			expect( pages._options.endpoint ).to.equal( '/custom-endpoint/' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( pages._options.endpoint ).to.equal( '/wp-json/' );
			expect( pages._options.username ).to.equal( 'foouser' );
			expect( pages._options.password ).to.equal( 'barpass' );
		});

		it( 'should initialize the base path component', function() {
			expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( pages ).to.have.property( '_supportedMethods' );
			expect( pages._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit PagesRequest from WPRequest', function() {
			expect( pages instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'URL Generation', function() {

		it( 'should restrict path changes to a single instance', function() {
			pages.id( 2 );
			var newPages = site.pages().id( 3 ).revisions();
			expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages/2' );
			expect( newPages.toString() ).to.equal( '/wp-json/wp/v2/pages/3/revisions' );
		});

		describe( 'page collections', function() {

			it( 'should create the URL for retrieving all pages', function() {
				expect( pages.toString() ).to.equal( '/wp-json/wp/v2/pages' );
			});

			it( 'should provide filtering methods', function() {
				expect( pages ).to.have.property( 'slug' );
				expect( pages.slug ).to.be.a( 'function' );
				var path = pages.slug( 'some-slug' ).toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages?slug=some-slug' );
			});

		});

		describe( '.id()', function() {

			it( 'is defined', function() {
				expect( pages ).to.have.property( 'id' );
				expect( pages.id ).to.be.a( 'function' );
			});

			it( 'should create the URL for retrieving a specific post', function() {
				var path = pages.id( 1337 ).toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337' );
			});

			it( 'should update the supported methods when setting ID', function() {
				pages.id( 8 );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			});

		});

		describe( '.revisions()', function() {

			it( 'is defined', function() {
				expect( pages ).to.have.property( 'revisions' );
			});

			it( 'is a function', function() {
				expect( pages.revisions ).to.be.a( 'function' );
			});

			it( 'should create the URL for retrieving the revisions for a specific post', function() {
				var path = pages.id( 1337 ).revisions().toString();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/revisions' );
			});

		});

	});

});
