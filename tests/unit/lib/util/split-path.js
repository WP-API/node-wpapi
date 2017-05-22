'use strict';
var chai = require( 'chai' );
var sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );
var expect = chai.expect;

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

});
