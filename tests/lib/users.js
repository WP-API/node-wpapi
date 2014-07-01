'use strict';
var expect = require( 'chai' ).expect;

var UsersRequest = require( '../../lib/users' );

describe( 'wp.users', function() {

	var users;

	describe( 'constructor', function() {

		beforeEach(function() {
			users = new UsersRequest();
		});

		it( 'should create a UsersRequest instance', function() {
			expect( users instanceof UsersRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			users = new UsersRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( users._options.booleanProp ).to.be.true;
			expect( users._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should force authentication', function() {
			expect( users._options ).to.have.property( 'auth' );
			expect( users._options.auth ).to.be.true;
		});

		it( 'should default _options to { auth: true }', function() {
			expect( users._options ).to.deep.equal({
				auth: true
			});
		});

		it( 'should initialize instance properties', function() {
			expect( users._filters ).to.deep.equal( {} );
			expect( users._path ).to.deep.equal( {} );
			expect( users._params ).to.deep.equal( {} );
			var _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'get|head|post' );
		});

		it( 'should inherit prototype methods from both ancestors', function() {
			// Spot-check from CollectionRequest:
			expect( users ).to.have.property( 'param' );
			expect( users.param ).to.be.a( 'function' );
			// From WPRequest:
			expect( users ).to.have.property( 'get' );
			expect( users.get ).to.be.a( 'function' );
			expect( users ).to.have.property( '_renderURI' );
			expect( users._renderURI ).to.be.a( 'function' );
		});

	});

	describe( '_pathValidators', function() {

		it( 'has a validator for the "id" property', function() {
			var users = new UsersRequest();
			expect( users._pathValidators ).to.deep.equal({
				id: /(^\d+$|^me$)/
			});
		});

	});

	describe( '.me()', function() {

		it( 'sets the path to users/me', function() {
			var users = new UsersRequest();
			users._options = {
				endpoint: 'url/endpoint'
			};
			users.me();
			expect( users._path ).to.have.property( 'id' );
			expect( users._path.id ).to.equal( 'me' );
		});

	});

	describe( '.id()', function() {

		it( 'sets the path ID to the passed-in value', function() {
			var users = new UsersRequest();
			users._options = {
				endpoint: 'url/endpoint'
			};
			users.id( 2501 );
			expect( users._path ).to.have.property( 'id' );
			expect( users._path.id ).to.equal( 2501 );
		});

	});

	describe( 'prototype._renderURI', function() {

		var users;

		beforeEach(function() {
			users = new UsersRequest();
			users._options = {
				endpoint: '/wp-json/'
			};
		});

		it( 'should create the URL for retrieving all users', function() {
			var url = users._renderURI();
			expect( url ).to.equal( '/wp-json/users' );
		});

		it( 'should create the URL for retrieving the current user', function() {
			var url = users.me()._renderURI();
			var _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( url ).to.equal( '/wp-json/users/me' );
			expect( _supportedMethods ).to.equal( 'get|head' );
		});

		it( 'should create the URL for retrieving a specific user by ID', function() {
			var url = users.id( 1337 )._renderURI();
			var _supportedMethods = users._supportedMethods.sort().join( '|' );
			expect( url ).to.equal( '/wp-json/users/1337' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

	});

});
