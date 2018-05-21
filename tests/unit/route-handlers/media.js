'use strict';
var expect = require( 'chai' ).expect;

var WPAPI = require( '../../../wpapi' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.media', () => {
	var site;
	var media;

	beforeEach( () => {
		site = new WPAPI({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		media = site.media();
	});

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			media = site.media({
				endpoint: '/custom-endpoint/'
			});
			expect( media._options.endpoint ).to.equal( '/custom-endpoint/' );
		});

		it( 'should initialize _options to the site defaults', () => {
			expect( media._options.endpoint ).to.equal( '/wp-json/' );
			expect( media._options.username ).to.equal( 'foouser' );
			expect( media._options.password ).to.equal( 'barpass' );
		});

		it( 'should initialize the base path component', () => {
			expect( media.toString() ).to.equal( '/wp-json/wp/v2/media' );
		});

		it( 'should set a default _supportedMethods array', () => {
			expect( media ).to.have.property( '_supportedMethods' );
			expect( media._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit MediaRequest from WPRequest', () => {
			expect( media instanceof WPRequest ).to.be.true;
		});

	});

	describe( '.id()', () => {

		it( 'is defined', () => {
			expect( media ).to.have.property( 'id' );
		});

		it( 'is a function', () => {
			expect( media.id ).to.be.a( 'function' );
		});

		it( 'should set the ID value in the path', () => {
			media.id( 8 );
			expect( media.toString() ).to.equal( '/wp-json/wp/v2/media/8' );
		});

		it( 'should update the supported methods', () => {
			media.id( 8 );
			var _supportedMethods = media._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

		it( 'throws an error on successive calls', () => {
			expect(function successiveCallsThrowsError() {
				media.id( 8 ).id( 3 );
			}).to.throw();
		});

		it( 'passes validation when called with a number', () => {
			expect(function numberPassesValidation() {
				media.id( 8 )._renderPath();
			}).not.to.throw();
		});

		it( 'passes validation when called with a number formatted as a string', () => {
			expect(function numberAsStringPassesValidation() {
				media.id( '9' )._renderPath();
			}).not.to.throw();
		});

		it( 'causes a validation error when called with a non-number', () => {
			expect(function stringFailsValidation() {
				media.id( 'wombat' )._renderPath();
			}).to.throw();
		});

	});

	describe( 'url generation', () => {

		it( 'should create the URL for the media collection', () => {
			var uri = media.toString();
			expect( uri ).to.equal( '/wp-json/wp/v2/media' );
		});

		it( 'can paginate the media collection responses', () => {
			var uri = media.page( 4 ).toString();
			expect( uri ).to.equal( '/wp-json/wp/v2/media?page=4' );
		});

		it( 'should create the URL for a specific media object', () => {
			var uri = media.id( 1492 ).toString();
			expect( uri ).to.equal( '/wp-json/wp/v2/media/1492' );
		});

	});

});
