'use strict';
const { expect } = require( 'chai' );

describe( 'Object reduction tools:', () => {
	// Ensure parity with the relevant signature & functionality of lodash.reduce
	[
		{
			name: 'lodash.reduce (for API parity verification)',
			fn: require( 'lodash.reduce' )
		}, {
			name: 'objectReduce utility',
			fn: require( '../../../../lib/util/object-reduce' )
		}
	].forEach( ( test ) => {

		describe( test.name, () => {
			const objectReduce = test.fn;
			let obj;

			beforeEach( () => {
				obj = {};
			} );

			it( 'is defined', () => {
				expect( objectReduce ).to.exist;
			} );

			it( 'is a function', () => {
				expect( objectReduce ).to.be.a( 'function' );
			} );

			it( 'resolves to the provided initial value if called on an empty object', () => {
				expect( objectReduce( {}, () => {}, 'Sasquatch' ) ).to.equal( 'Sasquatch' );
			} );

			it( 'can be used to reduce over an object', () => {
				const result = objectReduce( {
					key1: 'val1',
					key2: 'val2',
					key3: 'val3'
				}, ( memo, val, key ) => memo + val + key, 'result:' );
				expect( result ).to.equal( 'result:val1key1val2key2val3key3' );
			} );

		} );

	} );

} );
