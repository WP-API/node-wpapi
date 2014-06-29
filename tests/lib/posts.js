'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var PostsRequest = require( '../../lib/posts' );

describe( 'wp.posts', function() {

	describe( 'constructor', function() {

		it( 'should create a PostsRequest instance', function() {
			var query1 = new PostsRequest();
			expect( query1 instanceof PostsRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var posts = new PostsRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( posts._options.booleanProp ).to.be.true;
			expect( posts._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			var posts = new PostsRequest();
			expect( posts._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var posts = new PostsRequest();
			expect( posts._filters ).to.deep.equal({});
			expect( posts._taxonomyFilters ).to.deep.equal({});
			expect( posts._path ).to.deep.equal({});
			expect( posts._template ).to.equal( 'posts(/:id)(/:action)(/:actionId)' );
			var _supportedMethods = posts._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit PostsRequest from WPRequest using util.inherits', function() {
			var utilInherits = sinon.spy();
			sandbox.load( '../../lib/posts', {
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

		it( 'should extend PostsRequest.prototype with filter methods', function() {
			var mockFilterMixins = {
				filter: 'methods',
				getInstanceProp: function() {
					return this._id;
				}
			};
			var extend = sinon.spy( require( 'node.extend' ) );
			var SandboxedPostsRequest = sandbox.require( '../../lib/posts', {
				requires: {
					// './WPRequest': 'WPRequestMock',
					'./shared/filters': {
						mixins: mockFilterMixins
					},
					'node.extend': extend
				}
			});
			var posts = new SandboxedPostsRequest();
			posts._id = 7;

			expect( posts.filter ).to.equal( 'methods' );
			expect( posts.getInstanceProp() ).to.equal( 7 );
			// [ 0 ][ 1 ]: Call #1, Argument #2 should be the mixins property from the filter mock
			expect( extend.args[ 0 ][ 1 ] ).to.deep.equal( mockFilterMixins );
		});

	});

	describe( '_pathValidators', function() {

		it( 'defines validators for id and action', function() {
			var posts = new PostsRequest();
			expect( posts._pathValidators ).to.deep.equal({
				id: /^\d+$/,
				action: /(meta|comments|revisions)/
			});
		});

	});

	describe( 'URL Generation', function() {

		var posts;

		beforeEach(function() {
			posts = new PostsRequest();
			posts._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all posts', function() {
			var path = posts._renderURI();
			expect( path ).to.equal( '/wp-json/posts' );
		});

		it( 'should create the URL for retrieving a specific post', function() {
			var path = posts.id( 1337 )._renderURI();
			expect( path ).to.equal( '/wp-json/posts/1337' );
		});

		it( 'throws an error if an invalid ID is specified', function() {
			expect(function numberPassesValidation() {
				posts._path = { id: 8 };
				posts._renderPath();
			}).not.to.throw();

			expect(function stringFailsValidation() {
				posts._path = { id: 'wombat' };
				posts._renderPath();
			}).to.throw();
		});

		it( 'should create the URL for retrieving all comments for a specific post', function() {
			var path = posts.id( 1337 ).comments()._renderURI();
			expect( path ).to.equal( '/wp-json/posts/1337/comments' );
		});

		it( 'should create the URL for retrieving a specific comment', function() {
			var path = posts.id( 1337 ).comments().comment( 9001 )._renderURI();
			expect( path ).to.equal( '/wp-json/posts/1337/comments/9001' );
		});

		it( 'should force the "comments" action when comment() is called', function() {
			var path = posts.id( 2501 ).comment( 9 )._renderURI();
			expect( path ).to.equal( '/wp-json/posts/2501/comments/9' );
		});

		it( 'should create the URL for retrieving the revisions for a specific post', function() {
			var path = posts.id( 1337 ).revisions()._renderURI();
			expect( path ).to.equal( '/wp-json/posts/1337/revisions' );
		});

		it( 'should restrict template changes to a single instance', function() {
			posts._template = 'path/with/post/nr/:id';
			var newPosts = new PostsRequest();
			newPosts._options.endpoint = 'endpoint/url/';
			var path = newPosts.id( 3 )._renderURI();
			expect( path ).to.equal( 'endpoint/url/posts/3' );
		});

	});

});
