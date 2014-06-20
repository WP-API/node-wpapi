const chai = require( 'chai' );
const expect = chai.expect;

const WP = require( '../' );

describe( 'wp.users', function() {

	var wp = new WP( { endpoint: '/wp-json' } );
	var users = wp.users();

	it( 'should create the URL for retrieving all users', function() {
		var url = users.generateRequestUri();
		expect( url ).to.equal( '/wp-json/users' );
	} );

	it( 'should create the URL for retrieving the current user', function() {
		var url = users.me().generateRequestUri();
		expect( url ).to.equal( '/wp-json/users/me' );
	} );

	it( 'should create the URL for retrieving a specific user by ID', function() {
		var url = users.id( 1337 ).generateRequestUri();
		expect( url ).to.equal( '/wp-json/users/1337' );
	} );

} );
