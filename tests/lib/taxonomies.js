'use strict';
var expect = require( 'chai' ).expect;

var TaxonomiesRequest = require( '../../lib/taxonomies' );
var CollectionRequest = require( '../../lib/shared/collection-request' );
var WPRequest = require( '../../lib/shared/wp-request' );

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
			expect( taxonomies._path ).to.deep.equal( {} );
			expect( taxonomies._params ).to.deep.equal( {} );
			expect( taxonomies._template ).to.equal( 'taxonomies(/:taxonomy)(/:action)(/:term)' );
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

	describe( '_pathValidators', function() {

		it( 'has a validator for the "action" property', function() {
			var taxonomies = new TaxonomiesRequest();
			expect( taxonomies._pathValidators ).to.deep.equal({
				action: /terms/
			});
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

		it( 'should create the URL for retrieving all taxonomies', function() {
			var url = taxonomies._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies' );
		});

		it( 'should create the URL for retrieving a specific taxonomy', function() {
			var url = taxonomies.taxonomy( 'my-tax' )._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax' );
		});

		it( 'should create the URL for retrieving all terms for a specific taxonomy', function() {
			var url = taxonomies.taxonomy( 'my-tax' ).terms()._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms' );
		});

		it( 'should error if any _path.action other than "terms" is set', function() {
			taxonomies._path.action = 'something',
			expect(function actionMustBeTerms() {
				taxonomies._renderURI();
			}).to.throw();
		});

		it( 'should create the URL for retrieving a specific taxonomy term', function() {
			var url = taxonomies.taxonomy( 'my-tax' ).terms().term( 1337 )._renderURI();
			expect( url ).to.equal( '/wp-json/taxonomies/my-tax/terms/1337' );
		});

	});

});
