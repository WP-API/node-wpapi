'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var TypesRequest = require( '../../lib/types' );

describe( 'wp.types', function() {

	describe( 'constructor', function() {

		it( 'should create a TypesRequest instance', function() {
			var query1 = new TypesRequest();
			expect( query1 instanceof TypesRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var types = new TypesRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( types._options.booleanProp ).to.be.true;
			expect( types._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should default _options to {}', function() {
			var types = new TypesRequest();
			expect( types._options ).to.deep.equal( {} );
		});

		it( 'should intitialize instance properties', function() {
			var types = new TypesRequest();
			var _supportedMethods = types._supportedMethods.sort().join( '|' );
			expect( types._path ).to.deep.equal({});
			expect( types._template ).to.equal( 'posts/types(/:type)' );
			expect( _supportedMethods ).to.equal( 'get|head' );
		});

		it( 'should inherit TypesRequest from WPRequest using util.inherits', function() {

			var utilInherits = sinon.spy();
			sandbox.load( '../../lib/types', {
				requires: {
					'./WPRequest': 'WPRequestMock',
					'util': {
						inherits: utilInherits
					}
				}
			});

			// [ 0 ][ 1 ]: Call #1, Argument #2 should be our request mock
			expect( utilInherits.args[ 0 ][ 1 ] ).to.equal( 'WPRequestMock' );
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
