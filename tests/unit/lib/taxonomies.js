'use strict';
var expect = require( 'chai' ).expect;

var TaxonomiesRequest = require( '../../../lib/taxonomies' );
var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

describe( 'wp.taxonomies', function() {

	describe( 'constructor', function() {

		var taxonomies;

		beforeEach(function() {
			taxonomies = new TaxonomiesRequest();
		});

		it( 'should create a TaxonomiesRequest instance', function() {
			expect( taxonomies instanceof TaxonomiesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			taxonomies = new TaxonomiesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( taxonomies._options.booleanProp ).to.be.true;
			expect( taxonomies._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			expect( taxonomies._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var _supportedMethods = taxonomies._supportedMethods.sort().join( '|' );
			expect( taxonomies._filters ).to.deep.equal( {} );
			expect( taxonomies._path ).to.deep.equal({ collection: 'taxonomies' });
			expect( taxonomies._params ).to.deep.equal( {} );
			expect( taxonomies._template ).to.equal( '(:collection)(/:term)' );
			expect( _supportedMethods ).to.equal( 'get|head' );
		});

		it( 'should inherit PostsRequest from CollectionRequest', function() {
			expect( taxonomies instanceof CollectionRequest ).to.be.true;
			expect( taxonomies instanceof WPRequest ).to.be.true;
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( taxonomies ).to.have.property( 'param' );
			expect( taxonomies.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( taxonomies ).to.have.property( 'get' );
			expect( taxonomies.get ).to.be.a( 'function' );
			expect( taxonomies ).to.have.property( '_renderURI' );
			expect( taxonomies._renderURI ).to.be.a( 'function' );
		});

	});

	describe( 'URL Generation', function() {

		var taxonomies;

		beforeEach(function() {
			taxonomies = new TaxonomiesRequest();
			taxonomies._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving a specific collection', function() {
			var url = taxonomies.collection( 'taxonomies' )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies' );
		});

		it( 'should create the URL for retrieving a specific taxonomy', function() {
			var url = taxonomies.collection( 'taxonomies' ).term( 'my-tax' )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/taxonomies/my-tax' );
		});

		it( 'should create the URL for retrieving taxonomies with a shared parent', function() {
			var url = taxonomies.collection( 'categories' ).parent( 42 )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/categories?parent=42' );
		});

		it( 'should permit specifying the parent for a collection of terms', function() {
			var url = taxonomies.collection( 'categories' ).forPost( 1234 )._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/categories?post=1234' );
		});

	});

});
