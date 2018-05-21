'use strict';
const { expect } = require( 'chai' );

const namedGroupRE = require( '../../../../lib/util/named-group-regexp' ).namedGroupRE;

describe( 'named PCRE group RegExp', () => {

	it( 'is a regular expression', () => {
		expect( namedGroupRE ).to.be.an.instanceof( RegExp );
	});

	it( 'will not match an arbitrary string', () => {
		const pathComponent = 'author';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).to.be.null;
	});

	it( 'identifies the name and RE pattern for a PCRE named group', () => {
		const pathComponent = '(?P<parent>[\\d]+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'parent' );
		expect( result[ 2 ] ).to.equal( '[\\d]+' );
	});

	it( 'identifies the name and RE pattern for another group', () => {
		const pathComponent = '(?P<id>\\d+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'id' );
		expect( result[ 2 ] ).to.equal( '\\d+' );
	});

	it( 'identifies RE patterns including forward slashes', () => {
		const pathComponent = '(?P<plugin>[a-z\\/\\.\\-_]+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'plugin' );
		expect( result[ 2 ] ).to.equal( '[a-z\\/\\.\\-_]+' );
	});

	it( 'will match an empty string if a "RE Pattern" if the pattern is omitted', () => {
		const pathComponent = '(?P<id>)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.to.be.null;
		expect( result[ 1 ] ).to.equal( 'id' );
		expect( result[ 2 ] ).to.equal( '' );
	});

});
