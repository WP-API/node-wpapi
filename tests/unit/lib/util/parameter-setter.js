'use strict';

const paramSetter = require( '../../../../lib/util/parameter-setter' );

describe( 'parameterSetter utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	} );

	it( 'is a function', () => {
		expect( typeof paramSetter ).toBe( 'function' );
	} );

	it( 'returns a function', () => {
		expect( typeof paramSetter() ).toBe( 'function' );
	} );

	it( 'creates a setter that calls this.param()', () => {
		obj.param = jest.fn();
		obj.setter = paramSetter( 'foo' );
		obj.setter( 'bar' );
		expect( obj.param ).toHaveBeenCalledWith( 'foo', 'bar' );
	} );

} );
