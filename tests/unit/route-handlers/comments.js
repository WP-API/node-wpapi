'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.comments', function() {
	var site;
	var comments;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		comments = site.comments();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			comments = site.comments({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( comments._options.booleanProp ).to.be.true;
			expect( comments._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( comments._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( comments ).to.have.property( '_supportedMethods' );
			expect( comments._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit CommentsRequest from WPRequest', function() {
			expect( comments instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'path part setters', function() {

		describe( '.id()', function() {

			it( 'provides a method to set the ID', function() {
				expect( comments ).to.have.property( 'id' );
				expect( comments.id ).to.be.a( 'function' );
			});

			it( 'should set the ID value in the path', function() {
				comments.id( 314159 );
				expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/314159' );
			});

			it( 'accepts ID parameters as strings', function() {
				comments.id( '8' );
				expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/8' );
			});

			it( 'should update the supported methods when setting ID', function() {
				comments.id( 8 );
				var _supportedMethods = comments._supportedMethods.sort().join( '|' );
				expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
			});

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

		it( 'does not throw an error if a valid numeric ID is specified', function() {
			expect(function numberPassesValidation() {
				comments.id( 8 );
				comments.validatePath();
			}).not.to.throw();
		});

		it( 'does not throw an error if a valid numeric ID is specified as a string', function() {
			expect( function numberAsStringPassesValidation() {
				comments.id( '8' );
				comments.validatePath();
			}).not.to.throw();
		});

		it( 'throws an error if a non-integer numeric string ID is specified', function() {
			expect( function nonIntegerNumberAsStringFailsValidation() {
				comments.id( 4.019 );
				comments.validatePath();
			}).to.throw();
		});

		it( 'throws an error if a non-numeric string ID is specified', function() {
			expect(function stringFailsValidation() {
				comments.id( 'wombat' );
				comments.validatePath();
			}).to.throw();
		});

		it( 'should restrict path changes to a single instance', function() {
			comments.id( 2 );
			var newComments = site.comments().id( 3 );
			expect( comments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/2' );
			expect( newComments._renderURI() ).to.equal( '/wp-json/wp/v2/comments/3' );
		});

	});

});
