'use strict';
var expect = require( 'chai' ).expect;

var CommentsRequest = require( '../../../lib/comments' );
var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

describe( 'wp.comments', function() {

	describe( 'constructor', function() {

		var comments;

		beforeEach(function() {
			comments = new CommentsRequest();
		});

		it( 'should create a CommentsRequest instance', function() {
			expect( comments instanceof CommentsRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			comments = new CommentsRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( comments._options.booleanProp ).to.be.true;
			expect( comments._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			expect( comments._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			expect( comments._path ).to.deep.equal( {} );
			expect( comments._template ).to.equal( 'comments(/:id)' );
			var _supportedMethods = comments._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit CommentsRequest from CollectionRequest', function() {
			expect( comments instanceof CollectionRequest ).to.be.true;
			expect( comments instanceof WPRequest ).to.be.true;
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( comments ).to.have.property( 'param' );
			expect( comments.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( comments ).to.have.property( 'get' );
			expect( comments.get ).to.be.a( 'function' );
			expect( comments ).to.have.property( '_renderURI' );
			expect( comments._renderURI ).to.be.a( 'function' );
		});

	});

	describe( '_pathValidators', function() {

		it( 'defines validators for id and action', function() {
			var comments = new CommentsRequest();
			expect( comments._pathValidators ).to.deep.equal({
				id: /^\d+$/
			});
		});

	});

	describe( 'query methods', function() {

		var comments;

		beforeEach(function() {
			comments = new CommentsRequest();
			comments._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'provides a method to set the ID', function() {
			expect( comments ).to.have.property( 'id' );
			expect( comments.id ).to.be.a( 'function' );
			comments.id( 314159 );
			expect( comments._path ).to.have.property( 'id' );
			expect( comments._path.id ).to.equal( 314159 );
		});

		it( 'parses ID parameters into integers', function() {
			comments.id( '8' );
			expect( comments._path ).to.have.property( 'id' );
			expect( comments._path.id ).to.equal( 8 );
			comments.id( 4.019 );
			expect( comments._path.id ).to.equal( 4 );
		});

		it( 'should update the supported methods when setting ID', function() {
			comments.id( 8 );
			var _supportedMethods = comments._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

	});

	describe( 'URL Generation', function() {

		var comments;

		beforeEach(function() {
			comments = new CommentsRequest();
			comments._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all comments', function() {
			var path = comments._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/comments' );
		});

		it( 'should create the URL for retrieving a specific comment', function() {
			var path = comments.id( 1337 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/comments/1337' );
		});

		it( 'throws an error if an invalid ID is specified', function() {
			expect(function numberPassesValidation() {
				comments._path = { id: 8 };
				comments._renderPath();
			}).not.to.throw();

			expect(function stringFailsValidation() {
				comments._path = { id: 'wombat' };
				comments._renderPath();
			}).to.throw();
		});

		it( 'should restrict template changes to a single instance', function() {
			comments._template = 'path/with/comment/nr/:id';
			var newComments = new CommentsRequest();
			newComments._options.endpoint = 'endpoint/url/';
			var path = newComments.id( 3 )._renderURI();
			expect( path ).to.equal( 'endpoint/url/wp/v2/comments/3' );
		});

	});

});
