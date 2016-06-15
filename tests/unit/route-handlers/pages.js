'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.pages', function() {
	var site;
	var pages;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		pages = site.pages();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			pages = site.pages({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( pages._options.booleanProp ).to.be.true;
			expect( pages._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( pages._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( pages._renderURI() ).to.equal( '/wp-json/wp/v2/pages' );
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
			expect( pages._renderURI() ).to.equal( '/wp-json/wp/v2/pages/2' );
			expect( newPages._renderURI() ).to.equal( '/wp-json/wp/v2/pages/3/revisions' );
		});

		describe( 'page collections', function() {

			it( 'should create the URL for retrieving all pages', function() {
				expect( pages._renderURI() ).to.equal( '/wp-json/wp/v2/pages' );
			});

			it( 'should provide filtering methods', function() {
				expect( pages ).to.have.property( 'filter' );
				expect( pages.filter ).to.be.a( 'function' );
				var path = pages.filter( 'name', 'some-slug' )._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages?filter%5Bname%5D=some-slug' );
			});

		});

		describe( '.id()', function() {

			it( 'should be defined', function() {
				expect( pages ).to.have.property( 'id' );
				expect( pages.id ).to.be.a( 'function' );
			});

			it( 'should create the URL for retrieving a specific post', function() {
				var path = pages.id( 1337 )._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337' );
			});

			it( 'should update the supported methods when setting ID', function() {
				pages.id( 8 );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			});

		});

		describe( '.path()', function() {

			it( 'should be defined', function() {
				expect( pages ).to.have.property( 'path' );
				expect( pages.path ).to.be.a( 'function' );
			});

			it( 'should create the URL for retrieving a post by path', function() {
				var path = pages.path( 'nested/page' )._renderURI();
				expect( path ).to
					.equal( '/wp-json/wp/v2/pages?filter%5Bpagename%5D=nested%2Fpage' );
			});

			it( 'should not update the supported methods when setting Path', function() {
				pages.path( 'page/path' );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
			});

		});

		describe.skip( 'comments', function() {

			it( 'should be defined', function() {
				expect( pages ).to.have.property( 'comments' );
				expect( pages.comments ).to.be.a( 'function' );
			});

			it( 'should create the URL for a page\'s comments collection', function() {
				var path = pages.id( 1337 ).comments()._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/comments' );
			});

			it( 'should set the correct supported methods for the comments endpoint', function() {
				pages.id( 1337 ).comments();
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'get|head' );
			});

			it( 'should create the URL for retrieving a specific comment', function() {
				var path = pages.id( 1337 ).comments().comment( 9001 )._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/comments/9001' );
			});

			it( 'should set the correct supported methods for the comment endpoint', function() {
				pages.id( 1337 ).comment( 8 );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head' );
			});

			it( 'should force action "comments" when calling .comment()', function() {
				var path = pages.id( 1337 ).comment( 9002 )._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/comments/9002' );
			});

		});

		describe( '.revisions()', function() {

			it( 'should be defined', function() {
				expect( pages ).to.have.property( 'revisions' );
				expect( pages.revisions ).to.be.a( 'function' );
			});

			it( 'should create the URL for retrieving the revisions for a specific post', function() {
				var path = pages.id( 1337 ).revisions()._renderURI();
				expect( path ).to.equal( '/wp-json/wp/v2/pages/1337/revisions' );
			});

			it.skip( 'should force authentication when querying pages/id/revisions', function() {
				pages.id( 1337 ).revisions();
				expect( pages._options ).to.have.property( 'auth' );
				expect( pages._options.auth ).to.be.true;
			});

		});

	});

});
