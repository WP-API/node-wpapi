'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.taxonomies', function() {
	var site;
	var taxonomies;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		taxonomies = site.taxonomies();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			taxonomies = site.taxonomies({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( taxonomies._options.booleanProp ).to.be.true;
			expect( taxonomies._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( taxonomies._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( taxonomies._renderURI() ).to.equal( '/wp-json/wp/v2/taxonomies' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( taxonomies ).to.have.property( '_supportedMethods' );
			expect( taxonomies._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit TaxonomiesRequest from WPRequest', function() {
			expect( taxonomies instanceof WPRequest ).to.be.true;
		});

	});

	describe( 'path part setters', function() {

		describe( '.taxonomy()', function() {

			it( 'provides a method to set the taxonomy', function() {
				expect( taxonomies ).to.have.property( 'taxonomy' );
				expect( taxonomies.taxonomy ).to.be.a( 'function' );
			});

		});

	});

	describe( 'URL Generation', function() {

		it( 'should create the URL for retrieving all taxonomies', function() {
			var url = taxonomies._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies' );
		});

		it( 'should create the URL for retrieving a specific taxonomy', function() {
			var url = taxonomies.taxonomy( 'category' )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies/category' );
		});

	});

});
