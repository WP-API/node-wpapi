'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var CommentsRequest = require( '../../../lib/comments' );
var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

describe.only( 'wp.comments', function() {
	var site;
	var comments;

	beforeEach(function() {
		site = WP.site( '/wp-json' );
		comments = site.comments();
		// comments = new CommentsRequest();
	});

	describe( 'constructor', function() {

		it( 'should create a CollectionRequest instance', function() {
			expect( comments instanceof CollectionRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			comments = site.comments({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( comments._options.booleanProp ).to.be.true;
			expect( comments._options.strProp ).to.equal( 'Some string' );
		});

		it.skip( 'should default _options to {}', function() {
			expect( comments._options ).to.deep.equal( {} );
		});

		it( 'should initialize the base path component', function() {
			expect( comments._path ).to.deep.equal( { '0': 'comments' } );
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

		it( 'provides a method to set the ID', function() {
			expect( comments ).to.have.property( 'id' );
			expect( comments.id ).to.be.a( 'function' );
			comments.id( 314159 );
			expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/314159' );
		});

		it( 'accepts ID parameters as strings', function() {
			comments.id( '8' );
			expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/8' );
		});

		it( 'converts ID parameters into integers', function() {
			comments.id( 4.019 );
			expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/4' );
		});

		it( 'should update the supported methods when setting ID', function() {
			comments.id( 8 );
			var _supportedMethods = comments._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

	});

	describe( 'URL Generation', function() {

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
			comments.id( 2 );
			var newComments = site.comments();
			var path = newComments.id( 3 )._renderURI();
			expect( path ).to.equal( '/wp-json/wp/v2/comments/3' );
		});

	});

});
