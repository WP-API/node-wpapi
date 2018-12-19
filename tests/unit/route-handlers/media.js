'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.media', () => {
	let site;
	let media;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		media = site.media();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			media = site.media( {
				endpoint: '/custom-endpoint/',
			} );
			expect( media._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( media._options.endpoint ).toBe( '/wp-json/' );
			expect( media._options.username ).toBe( 'foouser' );
			expect( media._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( media.toString() ).toBe( '/wp-json/wp/v2/media' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( media ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( media._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit MediaRequest from WPRequest', () => {
			expect( media instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( '.id()', () => {

		it( 'is defined', () => {
			expect( media ).toHaveProperty( 'id' );
		} );

		it( 'is a function', () => {
			expect( typeof media.id ).toBe( 'function' );
		} );

		it( 'should set the ID value in the path', () => {
			media.id( 8 );
			expect( media.toString() ).toBe( '/wp-json/wp/v2/media/8' );
		} );

		it( 'should update the supported methods', () => {
			media.id( 8 );
			const _supportedMethods = media._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).toBe( 'delete|get|head|patch|post|put' );
		} );

		it( 'throws an error on successive calls', () => {
			expect( () => {
				media.id( 8 ).id( 3 );
			} ).toThrow();
		} );

		it( 'passes validation when called with a number', () => {
			expect( () => {
				media.id( 8 )._renderPath();
			} ).not.toThrow();
		} );

		it( 'passes validation when called with a number formatted as a string', () => {
			expect( () => {
				media.id( '9' )._renderPath();
			} ).not.toThrow();
		} );

		it( 'causes a validation error when called with a non-number', () => {
			expect( () => {
				media.id( 'wombat' )._renderPath();
			} ).toThrow();
		} );

	} );

	describe( 'url generation', () => {

		it( 'should create the URL for the media collection', () => {
			const uri = media.toString();
			expect( uri ).toBe( '/wp-json/wp/v2/media' );
		} );

		it( 'can paginate the media collection responses', () => {
			const uri = media.page( 4 ).toString();
			expect( uri ).toBe( '/wp-json/wp/v2/media?page=4' );
		} );

		it( 'should create the URL for a specific media object', () => {
			const uri = media.id( 1492 ).toString();
			expect( uri ).toBe( '/wp-json/wp/v2/media/1492' );
		} );

	} );

} );
