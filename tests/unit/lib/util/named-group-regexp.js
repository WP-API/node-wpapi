'use strict';
var expect = require( 'chai' ).expect;

var namedGroupRE = require( '../../../../lib/util/named-group-regexp' ).namedGroupRE;

describe( 'named PCRE group RegExp', () => {

	it( 'is a regular expression', () => {
		expect( namedGroupRE ).to.be.an.instanceof( RegExp );
	});

	it( 'will not match an arbitrary string', () => {
		var pathComponent = 'author';
		var result = pathComponent.match( namedGroupRE );
		expect( result ).to.be.null;
	});

	it( 'identifies the name and RE pattern for a PCRE named group', () => {
		var pathComponent = '(?P<parent>[\\d]+)';
		var result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'parent' );
		expect( result[ 2 ] ).to.equal( '[\\d]+' );
	});

	it( 'identifies the name and RE pattern for another group', () => {
		var pathComponent = '(?P<id>\\d+)';
		var result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'id' );
		expect( result[ 2 ] ).to.equal( '\\d+' );
	});

	it( 'identifies RE patterns including forward slashes', () => {
		var pathComponent = '(?P<plugin>[a-z\\/\\.\\-_]+)';
		var result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'plugin' );
		expect( result[ 2 ] ).to.equal( '[a-z\\/\\.\\-_]+' );
	});

	it( 'will match an empty string if a "RE Pattern" if the pattern is omitted', () => {
		var pathComponent = '(?P<id>)';
		var result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'id' );
		expect( result[ 2 ] ).to.equal( '' );
	});

});
