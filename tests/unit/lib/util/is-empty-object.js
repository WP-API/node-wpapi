'use strict';

const isEmptyObject = require( '../../../../lib/util/is-empty-object' );

describe( 'isEmptyObject utility', () => {

	it( 'is defined', () => {
		expect( isEmptyObject ).toBeDefined();
	} );

	it( 'is a function', () => {
		expect( typeof isEmptyObject ).toBe( 'function' );
	} );

	it( 'returns true if passed an empty object', () => {
		expect( isEmptyObject( {} ) ).toBe( true );
	} );

	it( 'returns true if passed a constructed object with no instance properties', () => {
		function Ctor() {}
		Ctor.prototype.prop = 'val';
		expect( isEmptyObject( new Ctor() ) ).toBe( true );
	} );

	it( 'returns false if passed an object with own properties', () => {
		expect( isEmptyObject( { prop: 'value' } ) ).toBe( false );
	} );

	it( 'returns false if passed a constructed object with instance properties', () => {
		function Ctor() {
			this.prop = 'val';
		}
		expect( isEmptyObject( new Ctor() ) ).toBe( false );
	} );

	it( 'returns false if passed a string', () => {
		expect( isEmptyObject( '{}' ) ).toBe( false );
	} );

	it( 'returns false if passed an empty array', () => {
		expect( isEmptyObject( [] ) ).toBe( false );
	} );

	it( 'returns false if passed a boolean', () => {
		expect( isEmptyObject( true ) ).toBe( false );
		expect( isEmptyObject( false ) ).toBe( false );
	} );

	it( 'returns false if passed a number', () => {
		expect( isEmptyObject( 0 ) ).toBe( false );
		expect( isEmptyObject( 1337 ) ).toBe( false );
	} );

} );
