'use strict';

const argumentIsNumeric = require( '../../../../lib/util/argument-is-numeric' );

describe( 'argumentIsNumeric utility', () => {

	it( 'is a function', () => {
		expect( typeof argumentIsNumeric ).toBe( 'function' );
	} );

	it( 'returns true if provided an integer', () => {
		const result = argumentIsNumeric( 7 );
		expect( result ).toBe( true );
	} );

	it( 'returns true if provided an integer string', () => {
		const result = argumentIsNumeric( '2501' );
		expect( result ).toBe( true );
	} );

	it( 'returns true if provided an array of integers', () => {
		const result = argumentIsNumeric( [ 1, 3, 5, 8, 13 ] );
		expect( result ).toBe( true );
	} );

	it( 'returns true if provided an array of integer strings', () => {
		const result = argumentIsNumeric( [ '1', '3', '5', '8', '13' ] );
		expect( result ).toBe( true );
	} );

	it( 'returns true if provided a mixed array of integers and integer strings', () => {
		const result = argumentIsNumeric( [ 1, '3', 5, '8', 13 ] );
		expect( result ).toBe( true );
	} );

	it( 'returns false if provided a non-integer string', () => {
		const result = argumentIsNumeric( 'WordPress' );
		expect( result ).toBe( false );
	} );

	it( 'returns false if provided a non-integer numeric string value', () => {
		const result = argumentIsNumeric( '3.14159' );
		expect( result ).toBe( false );
	} );

	it( 'returns false if provided an array that contains any non-numeric string', () => {
		const result = argumentIsNumeric( [ 1, 3, 5, 'Eight' ] );
		expect( result ).toBe( false );
	} );

	it( 'returns false if provided an array of strings', () => {
		const result = argumentIsNumeric( [ 'One', 'Three' ] );
		expect( result ).toBe( false );
	} );

	it( 'returns false if provided a non-string, non-integer, non-array value', () => {
		expect( argumentIsNumeric( {} ) ).toBe( false );
		expect( argumentIsNumeric( null ) ).toBe( false );
		expect( argumentIsNumeric( /foo/ ) ).toBe( false );
		expect( argumentIsNumeric( false ) ).toBe( false );
	} );

} );
