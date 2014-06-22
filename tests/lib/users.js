const expect = require( 'chai' ).expect;

const UsersRequest = require( '../../lib/users' );

describe( 'wp.users', function() {

	describe( 'prototype.generateRequestUri', function() {

		var users;

		beforeEach(function() {
			users = new UsersRequest();
			users._options = {
				endpoint: '/wp-json'
			};
		});

		it( 'should create the URL for retrieving all users', function() {
			var url = users.generateRequestUri();
			expect( url ).to.equal( '/wp-json/users' );
		});

		it( 'should create the URL for retrieving the current user', function() {
			var url = users.me().generateRequestUri();
			expect( url ).to.equal( '/wp-json/users/me' );
		});

		it( 'should create the URL for retrieving a specific user by ID', function() {
			var url = users.id( 1337 ).generateRequestUri();
			expect( url ).to.equal( '/wp-json/users/1337' );
		});

	});

});
