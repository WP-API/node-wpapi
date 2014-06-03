var wp = require( './index.js' );
var options = {
	host: 'host.com',
	port: 80
};
var api = wp( options ).username( 'user' ).password( 'pass' );
api.posts().id( 100 ).comments().get( function( result ) {
	console.log( result );
} );