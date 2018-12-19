'use strict';

describe( 'Object reduction tools:', () => {
	// Ensure parity with the relevant signature & functionality of lodash.reduce
	[
		{
			name: 'lodash.reduce (for API parity verification)',
			fn: require( 'lodash.reduce' ),
		}, {
			name: 'objectReduce utility',
			fn: require( '../../../../lib/util/object-reduce' ),
		},
	].forEach( ( test ) => {

		describe( test.name, () => {
			const objectReduce = test.fn;

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

	} );

} );
