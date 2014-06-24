const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
const sandbox = require( 'sandboxed-module' );

const PostsRequest = require( '../../lib/posts' );

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
			expect( posts._action ).to.be.null;
			expect( posts._actionId ).to.be.null;
			expect( posts._id ).to.be.null;
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

	describe( 'prototype.generateRequestUri', function() {

		var posts;

		beforeEach(function() {
			posts = new PostsRequest();
			posts._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all posts', function() {
			expect( posts.generateRequestUri() ).to.equal( '/wp-json/posts' );
		});

		it( 'should create the URL for retrieving a specific post', function() {
			expect( posts.id( 1337 ).generateRequestUri() ).to.equal( '/wp-json/posts/1337' );
		});

		it( 'should create the URL for retrieving all comments for a specific post', function() {
			expect( posts.id( 1337 ).comments().generateRequestUri() ).to.equal(
				'/wp-json/posts/1337/comments' );
		});

		it( 'should create the URL for retrieving a specific comment', function() {
			expect( posts.id( 1337 ).comments().id( 9001 ).generateRequestUri() ).to.equal(
				'/wp-json/posts/1337/comments/9001' );
		});

	});

});
