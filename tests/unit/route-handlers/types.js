'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.types', function() {
	var site;
	var types;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		types = site.types();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			types = site.types({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( types._options.booleanProp ).to.be.true;
			expect( types._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( types._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( types._renderURI() ).to.equal( '/wp-json/wp/v2/types' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( types ).to.have.property( '_supportedMethods' );
			expect( types._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit PostsRequest from WPRequest', function() {
			expect( types instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'URL Generation', function() {

		it( 'should create the URL for retrieving all types', function() {
			var url = types._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/types' );
		});

		it( 'should create the URL for retrieving a specific term', function() {
			var url = types.type( 'some_type' )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/types/some_type' );
		});

	});

});
