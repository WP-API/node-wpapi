'use strict';
var expect = require( 'chai' ).expect;

var MediaRequest = require( '../../lib/media' );
var CollectionRequest = require( '../../lib/shared/collection-request' );
var WPRequest = require( '../../lib/shared/wp-request' );

describe( 'wp.media', function() {

	var media;

	beforeEach(function() {
		media = new MediaRequest();
	});

	describe( 'constructor', function() {

		it( 'should create a MediaRequest instance', function() {
			expect( media instanceof MediaRequest ).to.be.true;
		});

		it( 'should default _options to {}', function() {
			expect( media._options ).to.deep.equal( {} );
		});

		it( 'should set any passed-in options', function() {
			media = new MediaRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( media._options.booleanProp ).to.be.true;
			expect( media._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should intitialize instance properties', function() {
			expect( media._filters ).to.deep.equal( {} );
			expect( media._taxonomyFilters ).to.deep.equal( {} );
			expect( media._path ).to.deep.equal( {} );
			expect( media._params ).to.deep.equal( {} );
			expect( media._template ).to.equal( 'media(/:id)' );
			var _supportedMethods = media._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit MediaRequest from CollectionRequest', function() {
			expect( media instanceof CollectionRequest ).to.be.true;
			expect( media instanceof WPRequest ).to.be.true;
		});

	});

	describe( '_pathValidators', function() {

		it( 'has a validator for the "id" property', function() {
			expect( media._pathValidators ).to.deep.equal({
				id: /^\d+$/
			});
		});

	});

	describe( '.id()', function() {

		it( 'should be defined', function() {
			expect( media ).to.have.property( 'id' );
			expect( media.id ).to.be.a( 'function' );
		});

		it( 'should set the ID value in the template', function() {
			media.id( 8 );
			expect( media._path ).to.have.property( 'id' );
			expect( media._path.id ).to.equal( 8 );
		});

		it( 'should update the supported methods', function() {
			media.id( 8 );
			var _supportedMethods = media._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

		it( 'replaces values on successive calls', function() {
			media.id( 8 ).id( 3 );
			expect( media._path.id ).to.equal( 3 );
		});

		it( 'causes a validation error when called with a non-number', function() {
			expect(function numberPassesValidation() {
				media._path = { id: 8 };
				media._renderPath();
				media._path.id = '9';
				media._renderPath();
			}).not.to.throw();

			expect(function stringFailsValidation() {
				media._path = { id: 'wombat' };
				media._renderPath();
			}).to.throw();
		});

	});

	describe( 'url generation', function() {

		beforeEach(function() {
			media._options = {
				endpoint: 'http://some-site.com/wp-json/'
			};
		});

		it( 'should create the URL for the media collection', function() {
			var uri = media._renderURI();
			expect( uri ).to.equal( 'http://some-site.com/wp-json/media' );
		});

		it( 'can paginate the media collection responses', function() {
			var uri = media.page( 4 )._renderURI();
			expect( uri ).to.equal( 'http://some-site.com/wp-json/media?page=4' );
		});

		it( 'should create the URL for a specific media object', function() {
			var uri = media.id( 1492 )._renderURI();
			expect( uri ).to.equal( 'http://some-site.com/wp-json/media/1492' );
		});

	});

});
