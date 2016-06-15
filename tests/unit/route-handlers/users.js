'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../../wp' );
var WPRequest = require( '../../../lib/constructors/wp-request' );

describe( 'wp.users', function() {
	var site;
	var users;

	beforeEach(function() {
		site = new WP({
			endpoint: '/wp-json',
			username: 'foouser',
			password: 'barpass'
		});
		users = site.users();
	});

	describe( 'constructor', function() {

		it( 'should set any passed-in options', function() {
			users = site.users({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( users._options.booleanProp ).to.be.true;
			expect( users._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should initialize _options to the site defaults', function() {
			expect( users._options ).to.deep.equal({
				endpoint: '/wp-json/',
				username: 'foouser',
				password: 'barpass'
			});
		});

		it( 'should initialize the base path component', function() {
			expect( users._renderURI() ).to.equal( '/wp-json/wp/v2/users' );
		});

		it( 'should set a default _supportedMethods array', function() {
			expect( users ).to.have.property( '_supportedMethods' );
			expect( users._supportedMethods ).to.be.an( 'array' );
		});

		it( 'should inherit UsersRequest from WPRequest', function() {
			expect( users instanceof WPRequest ).to.be.true;
		});

	});

	describe( '.me()', function() {

		it( 'sets the path to users/me', function() {
			users.me();
			expect( users._renderURI() ).to.equal( '/wp-json/wp/v2/users/me' );
		});

	});

	describe( '.id()', function() {

		it( 'should be defined', function() {
			expect( users ).to.have.property( 'id' );
			expect( users.id ).to.be.a( 'function' );
		});

		it( 'sets the path ID to the passed-in value', function() {
			users.id( 2501 );
			expect( users._renderURI() ).to.equal( '/wp-json/wp/v2/users/2501' );
		});

	});

	describe( 'prototype._renderURI', function() {

		it( 'should create the URL for retrieving all users', function() {
			var url = users._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/users' );
		});

		it( 'should create the URL for retrieving the current user', function() {
			var url = users.me()._renderURI();
			expect( url ).to.equal( '/wp-json/wp/v2/users/me' );
		});

		it( 'should create the URL for retrieving a specific user by ID', function() {
			var url = users.id( 1337 )._renderURI();
			var _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( url ).to.equal( '/wp-json/wp/v2/users/1337' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

	});

});
