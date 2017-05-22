'use strict';
var expect = require( 'chai' ).expect;

var splitPath = require( '../../../../lib/util/split-path' );

describe( 'splitPath utility', function() {

	it( 'is a function', function() {
		expect( splitPath ).to.be.a( 'function' );
	});

	it( 'splits a simple path on the "/" character', function() {
		expect( splitPath( 'a/b/c/d' ) ).to.deep.equal([ 'a', 'b', 'c', 'd' ]);
	});

	it( 'correctly splits a string containing named capture groups', function() {
		var result = splitPath( '/posts/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)' );
		expect( result ).to.deep.equal([
			'posts',
			'(?P<parent>[\\d]+)',
			'revisions',
			'(?P<id>[\\d]+)'
		]);
	});

	it( 'correctly splits a string when a named group regex contains a "/"', function() {
		var result = splitPath( '/plugin/(?P<plugin>[a-z\\/\\.\\-_]+)' );
		expect( result ).to.deep.equal([
			'plugin',
			'(?P<plugin>[a-z\\/\\.\\-_]+)'
		]);
	});

	it( 'correctly splits a string with levels containing text outside named groups', function() {
		// From user-contributed example on https://developer.wordpress.org/reference/functions/register_rest_route/
		// Note that this library does not support this syntax, but ensuring that
		// common variants of path strings are split correctly avoids situations
		// where an unexpected string format could cause an error.
		var result = splitPath( '/users/market=(?P<market>[a-zA-Z0-9-]+)/lat=(?P<lat>[a-z0-9 .\\-]+)/long=(?P<long>[a-z0-9 .\\-]+)' );
		expect( result ).to.deep.equal([
			'users',
			'market=(?P<market>[a-zA-Z0-9-]+)',
			'lat=(?P<lat>[a-z0-9 .\\-]+)',
			'long=(?P<long>[a-z0-9 .\\-]+)'
		]);
	});

	it( 'correctly splits a string with this situation', function() {
		var result = splitPath( '/plugin/(?P<plugin_slug>[^/]+)/committers/?' );
		expect( result ).to.deep.equal([
			'plugin',
			'(?P<plugin_slug>[^/]+)',
			'committers',
			'?'
		]);
	});

});
