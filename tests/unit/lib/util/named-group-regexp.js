'use strict';

const namedGroupRE = require( '../../../../lib/util/named-group-regexp' ).namedGroupRE;

describe( 'named PCRE group RegExp', () => {

	it( 'is a regular expression', () => {
		expect( namedGroupRE ).toBeInstanceOf( RegExp );
	} );

	it( 'will not match an arbitrary string', () => {
		const pathComponent = 'author';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).toBeNull();
	} );

	it( 'identifies the name and RE pattern for a PCRE named group', () => {
		const pathComponent = '(?P<parent>[\\d]+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.toBeNull();
		expect( result[ 1 ] ).toBe( 'parent' );
		expect( result[ 2 ] ).toBe( '[\\d]+' );
	} );

	it( 'identifies the name and RE pattern for another group', () => {
		const pathComponent = '(?P<id>\\d+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.toBeNull();
		expect( result[ 1 ] ).toBe( 'id' );
		expect( result[ 2 ] ).toBe( '\\d+' );
	} );

	it( 'identifies RE patterns including forward slashes', () => {
		const pathComponent = '(?P<plugin>[a-z\\/\\.\\-_]+)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.toBeNull();
		expect( result[ 1 ] ).toBe( 'plugin' );
		expect( result[ 2 ] ).toBe( '[a-z\\/\\.\\-_]+' );
	} );

	it( 'will match an empty string if a "RE Pattern" if the pattern is omitted', () => {
		const pathComponent = '(?P<id>)';
		const result = pathComponent.match( namedGroupRE );
		expect( result ).not.toBeNull();
		expect( result[ 1 ] ).toBe( 'id' );
		expect( result[ 2 ] ).toBe( '' );
	} );

} );
