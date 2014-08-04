'use strict';
var expect = require( 'chai' ).expect;

var PagesRequest = require( '../../lib/pages' );
var CollectionRequest = require( '../../lib/shared/collection-request' );
var WPRequest = require( '../../lib/shared/wp-request' );

describe( 'wp.pages', function() {

	describe( 'constructor', function() {

		var pages;

		beforeEach(function() {
			pages = new PagesRequest();
		});

		it( 'should create a PagesRequest instance', function() {
			expect( pages instanceof PagesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			pages = new PagesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( pages._options.booleanProp ).to.be.true;
			expect( pages._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			expect( pages._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			expect( pages._filters ).to.deep.equal( {} );
			expect( pages._taxonomyFilters ).to.deep.equal( {} );
			expect( pages._path ).to.deep.equal( {} );
			expect( pages._params ).to.deep.equal( {} );
			expect( pages._template ).to.equal( 'pages(/:id)(/:action)(/:commentId)' );
			var _supportedMethods = pages._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit PagesRequest from CollectionRequest', function() {
			expect( pages instanceof CollectionRequest ).to.be.true;
			expect( pages instanceof WPRequest ).to.be.true;
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( pages ).to.have.property( 'filter' );
			expect( pages.filter ).to.be.a( 'function' );
			expect( pages ).to.have.property( 'param' );
			expect( pages.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( pages ).to.have.property( 'get' );
			expect( pages.get ).to.be.a( 'function' );
			expect( pages ).to.have.property( '_renderURI' );
			expect( pages._renderURI ).to.be.a( 'function' );
		});

	});

	describe( '_pathValidators', function() {

		it( 'defines validators for action and commentId', function() {
			var pages = new PagesRequest();
			expect( pages._pathValidators ).to.deep.equal({
				action: /(comments|revisions)/,
				commentId: /^\d+$/
			});
		});

	});

	describe( 'URL Generation', function() {

		var pages;

		beforeEach(function() {
			pages = new PagesRequest();
			pages._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should restrict template changes to a single instance', function() {
			pages._template = 'path/with/post/nr/:id';
			var newPages = new PagesRequest();
			newPages._options.endpoint = 'endpoint/url/';
			var path = newPages.id( 3 )._renderURI();
			expect( path ).to.equal( 'endpoint/url/pages/3' );
		});

		describe( 'page collections', function() {

			it( 'should create the URL for retrieving all pages', function() {
				var path = pages._renderURI();
				expect( path ).to.equal( '/wp-json/pages' );
			});

			it( 'should provide filtering methods', function() {
				expect( pages ).to.have.property( 'filter' );
				expect( pages.filter ).to.be.a( 'function' );
				var path = pages.filter( 'name', 'some-slug' )._renderURI();
				expect( path ).to.equal( '/wp-json/pages?filter%5Bname%5D=some-slug' );
			});

		});

		describe( 'page resources', function() {

			it( 'should create the URL for retrieving a specific post', function() {
				var path = pages.id( 1337 )._renderURI();
				expect( path ).to.equal( '/wp-json/pages/1337' );
			});

			it( 'should create the URL for retrieving a post by path', function() {
				var path = pages.path( 'nested/page' )._renderURI();
				expect( path ).to.equal( '/wp-json/pages?filter%5Bpagename%5D=nested%2Fpage' );
			});

			it( 'should update the supported methods when setting ID', function() {
				pages.id( 8 );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
			});

			it( 'should not update the supported methods when setting Path', function() {
				pages.path( 'page/path' );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'get|head|post' );
			});

		});

		describe( 'comments', function() {

			it( 'should create the URL for a page\'s comments collection', function() {
				var path = pages.id( 1337 ).comments()._renderURI();
				expect( path ).to.equal( '/wp-json/pages/1337/comments' );
			});

			it( 'should set the correct supported methods for the comments endpoint', function() {
				pages.id( 1337 ).comments();
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'get|head' );
			});

			it( 'should create the URL for retrieving a specific comment', function() {
				var path = pages.id( 1337 ).comments().comment( 9001 )._renderURI();
				expect( path ).to.equal( '/wp-json/pages/1337/comments/9001' );
			});

			it( 'should set the correct supported methods for the comment endpoint', function() {
				pages.id( 1337 ).comment( 8 );
				var _supportedMethods = pages._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head' );
			});

			it( 'should force action "comments" when calling .comment()', function() {
				var path = pages.id( 1337 ).comment( 9002 )._renderURI();
				expect( path ).to.equal( '/wp-json/pages/1337/comments/9002' );
			});

		});

		it( 'should create the URL for retrieving the revisions for a specific post', function() {
			var path = pages.id( 1337 ).revisions()._renderURI();
			expect( path ).to.equal( '/wp-json/pages/1337/revisions' );
		});

		it( 'should force authentication when querying pages/id/revisions', function() {
			pages.id( 1337 ).revisions();
			expect( pages._options ).to.have.property( 'auth' );
			expect( pages._options.auth ).to.be.true;
		});

	});

});
