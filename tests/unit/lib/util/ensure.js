'use strict';

const ensure = require( '../../../../lib/util/ensure' );

describe( 'ensure utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	} );

	it( 'is defined', () => {
		expect( ensure ).toBeDefined();
	} );

	it( 'is a function', () => {
		expect( typeof ensure ).toBe( 'function' );
	} );

	it( 'sets a default property value on an object', () => {
		expect( obj ).not.toHaveProperty( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).toHaveProperty( 'foo' );
		expect( typeof obj.foo ).toBe( 'string' );
		expect( obj.foo ).toBe( 'bar' );
	} );

	it( 'will not overwrite an existing value on an object', () => {
		obj.foo = 'baz';
		expect( obj ).toHaveProperty( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).toHaveProperty( 'foo' );
		expect( typeof obj.foo ).toBe( 'string' );
		expect( obj.foo ).toBe( 'baz' );
	} );

	it( 'will not overwrite a falsy value on an object', () => {
		obj.foo = 0;
		expect( obj ).toHaveProperty( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).toHaveProperty( 'foo' );
		expect( typeof obj.foo ).toBe( 'number' );
		expect( obj.foo ).toBe( 0 );
	} );

} );
