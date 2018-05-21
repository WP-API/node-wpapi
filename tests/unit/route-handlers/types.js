'use strict';
var expect = require( 'chai' ).expect;

var WPAPI = require( '../../../wpapi' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.types', () => {
	var site;
	var types;

	beforeEach( () => {
		site = new WPAPI({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		types = site.types();
	});

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			types = site.types({
				endpoint: '/custom-endpoint/'
			});
			expect( types._options.endpoint ).to.equal( '/custom-endpoint/' );
		});

		it( 'should initialize _options to the site defaults', () => {
			expect( types._options.endpoint ).to.equal( '/wp-json/' );
			expect( types._options.username ).to.equal( 'foouser' );
			expect( types._options.password ).to.equal( 'barpass' );
		});

		it( 'should initialize the base path component', () => {
			expect( types.toString() ).to.equal( '/wp-json/wp/v2/types' );
		});

		it( 'should set a default _supportedMethods array', () => {
			expect( types ).to.have.property( '_supportedMethods' );
			expect( types._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit PostsRequest from WPRequest', () => {
			expect( types instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'URL Generation', () => {

		it( 'should create the URL for retrieving all types', () => {
			var url = types.toString();
			expect( url ).to.equal( '/wp-json/wp/v2/types' );
		});

		it( 'should create the URL for retrieving a specific term', () => {
			var url = types.type( 'some_type' ).toString();
			expect( url ).to.equal( '/wp-json/wp/v2/types/some_type' );
		});

	});

});
