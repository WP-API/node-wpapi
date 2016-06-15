'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.media', function() {
	var site;
	var media;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		media = site.media();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			media = site.media({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( media._options.booleanProp ).to.be.true;
			expect( media._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( media._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( media._renderURI() ).to.equal( '/wp-json/wp/v2/media' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( media ).to.have.property( '_supportedMethods' );
			expect( media._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit MediaRequest from WPRequest', function() {
			expect( media instanceof WPRequest ).to.be.true;
		});

	});

	describe( '.id()', function() {

		it( 'should be defined', function() {
			expect( media ).to.have.property( 'id' );
			expect( media.id ).to.be.a( 'function' );
		});

		it( 'should set the ID value in the path', function() {
			media.id( 8 );
			expect( media._renderURI() ).to.equal( '/wp-json/wp/v2/media/8' );
		});

		it( 'should update the supported methods', function() {
			media.id( 8 );
			var _supportedMethods = media._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

		it( 'throws an error on successive calls', function() {
			expect(function successiveCallsThrowsError() {
				media.id( 8 ).id( 3 );
			}).to.throw();
		});

		it( 'passes validation when called with a number', function() {
			expect(function numberPassesValidation() {
				media.id( 8 )._renderPath();
			}).not.to.throw();
		});

		it( 'passes validation when called with a number formatted as a string', function() {
			expect(function numberAsStringPassesValidation() {
				media.id( '9' )._renderPath();
			}).not.to.throw();
		});

		it( 'causes a validation error when called with a non-number', function() {
			expect(function stringFailsValidation() {
				media.id( 'wombat' )._renderPath();
			}).to.throw();
		});

	});

	describe( 'url generation', function() {

		it( 'should create the URL for the media collection', function() {
			var uri = media._renderURI();
			expect( uri ).to.equal( '/wp-json/wp/v2/media' );
		});

		it( 'can paginate the media collection responses', function() {
			var uri = media.page( 4 )._renderURI();
			expect( uri ).to.equal( '/wp-json/wp/v2/media?page=4' );
		});

		it( 'should create the URL for a specific media object', function() {
			var uri = media.id( 1492 )._renderURI();
			expect( uri ).to.equal( '/wp-json/wp/v2/media/1492' );
		});

	});

});
