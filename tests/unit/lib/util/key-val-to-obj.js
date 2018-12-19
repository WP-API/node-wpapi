'use strict';

const keyValToObj = require( '../../../../lib/util/key-val-to-obj' );

describe( 'keyValToObj utility', () => {

	it( 'is defined', () => {
		expect( keyValToObj ).toBeDefined();
	} );

	it( 'is a function', () => {
		expect( typeof keyValToObj ).toBe( 'function' );
	} );

	it( 'returns an object', () => {
		expect( typeof keyValToObj() ).toBe( 'object' );
	} );

	it( 'sets the specified value at the provided key on the returned object', () => {
		const result = keyValToObj( 'propName', 123456 );
		expect( result ).toHaveProperty( 'propName' );
		expect( result ).toEqual( {
			propName: 123456,
		} );
	} );

	it( 'can be used to set an array, and sets values by reference', () => {
		const arr = [ 'mimsy', 'borogoves', 'outgrabe' ];
		const result = keyValToObj( 'words', arr );
		expect( result ).toHaveProperty( 'words' );
		expect( result.words ).toBe( arr );
		expect( result ).toEqual( {
			words: [ 'mimsy', 'borogoves', 'outgrabe' ],
		} );
	} );

} );
