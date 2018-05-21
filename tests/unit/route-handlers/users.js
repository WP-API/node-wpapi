'use strict';
var expect = require( 'chai' ).expect;

var WPAPI = require( '../../../wpapi' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.users', () => {
	var site;
	var users;

	beforeEach( () => {
		site = new WPAPI({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		users = site.users();
	});

	describe( 'constructor', () => {

		it( 'should set any passed-in options', () => {
			users = site.users({
				endpoint: '/custom-endpoint/'
			});
			expect( users._options.endpoint ).to.equal( '/custom-endpoint/' );
		});

		it( 'should initialize _options to the site defaults', () => {
			expect( users._options.endpoint ).to.equal( '/wp-json/' );
			expect( users._options.username ).to.equal( 'foouser' );
			expect( users._options.password ).to.equal( 'barpass' );
		});

		it( 'should initialize the base path component', () => {
			expect( users.toString() ).to.equal( '/wp-json/wp/v2/users' );
		});

		it( 'should set a default _supportedMethods array', () => {
			expect( users ).to.have.property( '_supportedMethods' );
			expect( users._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit UsersRequest from WPRequest', () => {
			expect( users instanceof WPRequest ).to.be.true;
		});

	});

	describe( '.me()', () => {

		it( 'sets the path to users/me', () => {
			users.me();
			expect( users.toString() ).to.equal( '/wp-json/wp/v2/users/me' );
		});

	});

	describe( '.id()', () => {

		it( 'is defined', () => {
			expect( users ).to.have.property( 'id' );
		});

		it( 'is a function', () => {
			expect( users.id ).to.be.a( 'function' );
		});

		it( 'sets the path ID to the passed-in value', () => {
			users.id( 2501 );
			expect( users.toString() ).to.equal( '/wp-json/wp/v2/users/2501' );
		});

	});

	describe( 'prototype.toString', () => {

		it( 'should create the URL for retrieving all users', () => {
			var url = users.toString();
			expect( url ).to.equal( '/wp-json/wp/v2/users' );
		});

		it( 'should create the URL for retrieving the current user', () => {
			var url = users.me().toString();
			expect( url ).to.equal( '/wp-json/wp/v2/users/me' );
		});

		it( 'should create the URL for retrieving a specific user by ID', () => {
			var url = users.id( 1337 ).toString();
			var _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( url ).to.equal( '/wp-json/wp/v2/users/1337' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

	});

});
