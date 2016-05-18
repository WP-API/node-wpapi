'use strict';
var expect = require( 'chai' ).expect;

var PostsRequest = require( '../../../lib/posts' );
var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

describe( 'wp.posts', function() {

	describe( 'constructor', function() {

		var posts;

		beforeEach(function() {
			posts = new PostsRequest();
		});

		it( 'should create a PostsRequest instance', function() {
			expect( posts instanceof PostsRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			posts = new PostsRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( posts._options.booleanProp ).to.be.true;
			expect( posts._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			expect( posts._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			expect( posts._filters ).to.deep.equal( {} );
			expect( posts._taxonomyFilters ).to.deep.equal( {} );
			expect( posts._path ).to.deep.equal( { postType: 'posts' } );
			expect( posts._template ).to.equal( ':postType(/:id)(/:action)(/:actionId)' );
			var _supportedMethods = posts._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit PostsRequest from CollectionRequest', function() {
			expect( posts instanceof CollectionRequest ).to.be.true;
			expect( posts instanceof WPRequest ).to.be.true;
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( posts ).to.have.property( 'filter' );
			expect( posts.filter ).to.be.a( 'function' );
			expect( posts ).to.have.property( 'param' );
			expect( posts.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( posts ).to.have.property( 'get' );
			expect( posts.get ).to.be.a( 'function' );
			expect( posts ).to.have.property( '_renderURI' );
			expect( posts._renderURI ).to.be.a( 'function' );
		});

	});

	describe( '_pathValidators', function() {

		it( 'defines validators for id and action', function() {
			var posts = new PostsRequest();
			expect( posts._pathValidators ).to.deep.equal({
				id: /^\d+$/,
				action: /(meta|revisions)/
			});
		});

	});

	describe( 'query methods', function() {

		var posts;

		beforeEach(function() {
			posts = new PostsRequest();
			posts._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'provides a method to set the ID', function() {
			expect( posts ).to.have.property( 'id' );
			expect( posts.id ).to.be.a( 'function' );
			posts.id( 314159 );
			expect( posts._path ).to.have.property( 'id' );
			expect( posts._path.id ).to.equal( 314159 );
		});

		it( 'parses ID parameters into integers', function() {
			posts.id( '8' );
			expect( posts._path ).to.have.property( 'id' );
			expect( posts._path.id ).to.equal( 8 );
			posts.id( 4.019 );
			expect( posts._path.id ).to.equal( 4 );
		});

		it( 'should update the supported methods when setting ID', function() {
			posts.id( 8 );
			var _supportedMethods = posts._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

		it( 'provides a method to get the meta values for a post', function() {
			expect( posts ).to.have.property( 'meta' );
			expect( posts.meta ).to.be.a( 'function' );
			posts.id( 3 ).meta();
			expect( posts._path ).to.have.property( 'action' );
			expect( posts._path.action ).to.equal( 'meta' );
		});

		it( 'should force authentication when querying posts/id/meta', function() {
			posts.id( 1337 ).meta();
			expect( posts._options ).to.have.property( 'auth' );
			expect( posts._options.auth ).to.be.true;
		});

		it( 'should update the supported methods when querying for meta', function() {
			posts.id( 1066 ).meta();
			var _supportedMethods = posts._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'provides a method to get specific post meta objects by ID', function() {
			posts.id( 3 ).meta( 5 );
			expect( posts._path ).to.have.property( 'actionId' );
			expect( posts._path.actionId ).to.equal( 5 );
		});

		it( 'parses meta ID parameters into integers', function() {
			posts.id( 3 ).meta( '4' );
			expect( posts._path ).to.have.property( 'actionId' );
			expect( posts._path.actionId ).to.equal( 4 );
			posts.id( 3 ).meta( 3.14159 );
			expect( posts._path.actionId ).to.equal( 3 );
		});

		it( 'should force authentication when querying posts/id/meta/:id', function() {
			posts.id( 7331 ).meta( 7 );
			expect( posts._options ).to.have.property( 'auth' );
			expect( posts._options.auth ).to.be.true;
		});

		it( 'should update the supported methods when querying for meta', function() {
			posts.id( 1066 ).meta( 2501 );
			var _supportedMethods = posts._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
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
			expect( path ).to.equal( '/wp-json/wp/v2/posts' );
		});

		it( 'should create the URL for retrieving a specific post', function() {
			var path = posts.id( 1337 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337' );
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

		it( 'should create the URL for retrieving all meta for a specific post', function() {
			var path = posts.id( 1337 ).meta()._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/meta' );
		});

		it( 'should create the URL for retrieving a specific meta item', function() {
			var path = posts.id( 1337 ).meta( 2001 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/meta/2001' );
		});

		it( 'should create the URL for retrieving the revisions for a specific post', function() {
			var path = posts.id( 1337 ).revisions()._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/posts/1337/revisions' );
		});

		it( 'should force authentication when querying posts/id/revisions', function() {
			posts.id( 1337 ).revisions();
			expect( posts._options ).to.have.property( 'auth' );
			expect( posts._options.auth ).to.be.true;
		});

		it( 'should restrict template changes to a single instance', function() {
			posts._template = 'path/with/post/nr/:id';
			var newPosts = new PostsRequest();
			newPosts._options.endpoint = 'endpoint/url/';
			var path = newPosts.id( 3 )._renderURI();
			expect( path ).to.equal( 'endpoint/url/wp/v2/posts/3' );
		});

	});

});
