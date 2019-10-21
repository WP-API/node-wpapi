'use strict';

const objectReduce = require( '../../../../lib/util/object-reduce' );

describe( 'objectReduce utility', () => {

	it( 'is defined', () => {
		expect( objectReduce ).toBeDefined();
	} );

	it( 'is a function', () => {
		expect( typeof objectReduce ).toBe( 'function' );
	} );

	it( 'resolves to the provided initial value if called on an empty object', () => {
		expect( objectReduce( {}, () => {}, 'Sasquatch' ) ).toBe( 'Sasquatch' );
	} );

	it( 'can be used to reduce over an object', () => {
		const result = objectReduce( {
			key1: 'val1',
			key2: 'val2',
			key3: 'val3',
		}, ( memo, val, key ) => memo + val + key, 'result:' );
		expect( result ).toBe( 'result:val1key1val2key2val3key3' );
	} );

} );
