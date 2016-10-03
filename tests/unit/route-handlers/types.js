'use strict';
var expect = require( 'chai' ).expect;

var WPAPI = require( '../../../wpapi' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.types', function() {
	var site;
	var types;

	beforeEach(function() {
		site = new WPAPI({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		types = site.types();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			types = site.types({
				endpoint: '/custom-endpoint/'
			});
			expect( types._options.endpoint ).to.equal( '/custom-endpoint/' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( types._options.endpoint ).to.equal( '/wp-json/' );
			expect( types._options.username ).to.equal( 'foouser' );
			expect( types._options.password ).to.equal( 'barpass' );
		});

		it( 'should initialize the base path component', function() {
			expect( types.toString() ).to.equal( '/wp-json/wp/v2/types' );
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
			var url = types.toString();
			expect( url ).to.equal( '/wp-json/wp/v2/types' );
		});

		it( 'should create the URL for retrieving a specific term', function() {
			var url = types.type( 'some_type' ).toString();
			expect( url ).to.equal( '/wp-json/wp/v2/types/some_type' );
		});

	});

});
