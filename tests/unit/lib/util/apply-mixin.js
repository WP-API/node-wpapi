'use strict';

const applyMixin = require( '../../../../lib/util/apply-mixin' );

describe( 'applyMixin utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	} );

	it( 'is a function', () => {
		expect( typeof applyMixin ).toBe( 'function' );
	} );

	it( 'returns nothing', () => {
		expect( applyMixin() ).toBeUndefined();
	} );

	it( 'assigns a method to the provided object', () => {
		const bar = () => {};
		applyMixin( obj, 'foo', bar );
		expect( obj ).toEqual( {
			foo: bar,
		} );
	} );

	it( 'does not mutate the object if the specified key exists already', () => {
		obj.foo = 'bar';
		applyMixin( obj, 'foo', () => {} );
		expect( obj ).toEqual( {
			foo: 'bar',
		} );
	} );

	it( 'does not mutate the object if third arg is not a function', () => {
		applyMixin( obj, 'key', 'not a function' );
		expect( obj ).toEqual( {} );
	} );

} );
