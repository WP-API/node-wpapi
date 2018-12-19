'use strict';

const WPAPI = require( '../../../wpapi' );
const WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.users', () => {
	let site;
	let users;

	beforeEach( () => {
		site = new WPAPI( {
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass',
		} );
		users = site.users();
	} );

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			users = site.users( {
				endpoint: '/custom-endpoint/',
			} );
			expect( users._options.endpoint ).toBe( '/custom-endpoint/' );
		} );

		it( 'should initialize _options to the site defaults', () => {
			expect( users._options.endpoint ).toBe( '/wp-json/' );
			expect( users._options.username ).toBe( 'foouser' );
			expect( users._options.password ).toBe( 'barpass' );
		} );

		it( 'should initialize the base path component', () => {
			expect( users.toString() ).toBe( '/wp-json/wp/v2/users' );
		} );

		it( 'should set a default _supportedMethods array', () => {
			expect( users ).toHaveProperty( '_supportedMethods' );
			expect( Array.isArray( users._supportedMethods ) ).toBe( true );
		} );

		it( 'should inherit UsersRequest from WPRequest', () => {
			expect( users instanceof WPRequest ).toBe( true );
		} );

	} );

	describe( '.me()', () => {

		it( 'sets the path to users/me', () => {
			users.me();
			expect( users.toString() ).toBe( '/wp-json/wp/v2/users/me' );
		} );

	} );

	describe( '.id()', () => {

		it( 'is defined', () => {
			expect( users ).toHaveProperty( 'id' );
		} );

		it( 'is a function', () => {
			expect( typeof users.id ).toBe( 'function' );
		} );

		it( 'sets the path ID to the passed-in value', () => {
			users.id( 2501 );
			expect( users.toString() ).toBe( '/wp-json/wp/v2/users/2501' );
		} );

	} );

	describe( 'prototype.toString', () => {

		it( 'should create the URL for retrieving all users', () => {
			const url = users.toString();
			expect( url ).toBe( '/wp-json/wp/v2/users' );
		} );

		it( 'should create the URL for retrieving the current user', () => {
			const url = users.me().toString();
			expect( url ).toBe( '/wp-json/wp/v2/users/me' );
		} );

		it( 'should create the URL for retrieving a specific user by ID', () => {
			const url = users.id( 1337 ).toString();
			const _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( url ).toBe( '/wp-json/wp/v2/users/1337' );
			expect( _supportedMethods ).toBe( 'delete|get|head|patch|post|put' );
		} );

	} );

} );
