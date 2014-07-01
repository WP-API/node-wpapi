'use strict';
var expect = require( 'chai' ).expect;

var TypesRequest = require( '../../lib/types' );
var CollectionRequest = require( '../../lib/shared/collection-request' );
var WPRequest = require( '../../lib/shared/wp-request' );

describe( 'wp.types', function() {

	describe( 'constructor', function() {

		var types;

		beforeEach(function() {
			types = new TypesRequest();
		});

		it( 'should create a TypesRequest instance', function() {
			expect( types instanceof TypesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			types = new TypesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( types._options.booleanProp ).to.be.true;
			expect( types._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			expect( types._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var _supportedMethods = types._supportedMethods.sort().join( '|' );
			expect( types._filters ).to.deep.equal( {} );
			expect( types._path ).to.deep.equal( {} );
			expect( types._params ).to.deep.equal( {} );
			expect( types._template ).to.equal( 'posts/types(/:type)' );
			expect( _supportedMethods ).to.equal( 'get|head' );
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

		var types;

		beforeEach(function() {
			types = new TypesRequest();
			types._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all types', function() {
			var url = types._renderURI();
			expect( url ).to.equal( '/wp-json/posts/types' );
		});

		it( 'should create the URL for retrieving a specific term', function() {
			var url = types.type( 'some_type' )._renderURI();
			expect( url ).to.equal( '/wp-json/posts/types/some_type' );
		});

	});

});
