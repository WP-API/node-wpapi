'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var PagesRequest = require( '../../lib/pages' );

describe( 'wp.pages', function() {

	describe( 'constructor', function() {

		it( 'should create a PagesRequest instance', function() {
			var query1 = new PagesRequest();
			expect( query1 instanceof PagesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var pages = new PagesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( pages._options.booleanProp ).to.be.true;
			expect( pages._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			var pages = new PagesRequest();
			expect( pages._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var pages = new PagesRequest();
			expect( pages._filters ).to.deep.equal({});
			expect( pages._taxonomyFilters ).to.deep.equal({});
			expect( pages._path ).to.deep.equal({});
			expect( pages._template ).to.equal( 'pages(/:id)(/:action)(/:commentId)' );
			var _supportedMethods = pages._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit PagesRequest from WPRequest using util.inherits', function() {
			var utilInherits = sinon.spy();
			sandbox.load( '../../lib/pages', {
				requires: {
					'./WPRequest': 'WPRequestMock',
					'./shared/filters': { mixins: {} },
					'util': {
						inherits: utilInherits
					}
				}
			});

			// [ 0 ][ 1 ]: Call #1, Argument #2 should be our request mock
			expect( utilInherits.args[ 0 ][ 1 ] ).to.equal( 'WPRequestMock' );
		});

		it( 'should extend PagesRequest.prototype with filter methods', function() {
			var mockFilterMixins = {
				filter: 'methods',
				getInstanceProp: function() {
					return this._id;
				}
			};
			var extend = sinon.spy( require( 'node.extend' ) );
			var SandboxedPagesRequest = sandbox.require( '../../lib/pages', {
				requires: {
					// './WPRequest': 'WPRequestMock',
					'./shared/filters': {
						mixins: mockFilterMixins
					},
					'node.extend': extend
				}
			});
			var pages = new SandboxedPagesRequest();
			pages._id = 7;

			expect( pages.filter ).to.equal( 'methods' );
			expect( pages.getInstanceProp() ).to.equal( 7 );
			// [ 0 ][ 1 ]: Call #1, Argument #2 should be the mixins property from the filter mock
			expect( extend.args[ 0 ][ 1 ] ).to.deep.equal( mockFilterMixins );
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
				var path = pages.filter('name', 'some-slug')._renderURI();
				expect( path ).to.equal( '/wp-json/pages?filter%5Bname%5D=some-slug' );
			});

		});

		describe( 'page resources', function() {

			it( 'should create the URL for retrieving a specific post', function() {
				var path = pages.id( 1337 )._renderURI();
				expect( path ).to.equal( '/wp-json/pages/1337' );
			});

			it( 'should create the URL for retrieving a post by path', function() {
				var path = pages.path( 'some/nested/page' )._renderURI();
				expect( path ).to.equal( '/wp-json/pages/some/nested/page' );
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

	});

});
