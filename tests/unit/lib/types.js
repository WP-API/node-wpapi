'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

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

		it( 'should inherit PostsRequest from CollectionRequest', function() {
			expect( types instanceof CollectionRequest ).to.be.true;
			expect( types instanceof WPRequest ).to.be.true;
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( types ).to.have.property( 'filter' );
			expect( types.filter ).to.be.a( 'function' );
			expect( types ).to.have.property( 'param' );
			expect( types.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( types ).to.have.property( 'get' );
			expect( types.get ).to.be.a( 'function' );
			expect( types ).to.have.property( '_renderURI' );
			expect( types._renderURI ).to.be.a( 'function' );
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
