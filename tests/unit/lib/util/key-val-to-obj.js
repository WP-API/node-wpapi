'use strict';
const { expect } = require( 'chai' );

const keyValToObj = require( '../../../../lib/util/key-val-to-obj' );

describe( 'keyValToObj utility', () => {

	it( 'is defined', () => {
		expect( keyValToObj ).to.exist;
	} );

	it( 'is a function', () => {
		expect( keyValToObj ).to.be.a( 'function' );
	} );

	it( 'returns an object', () => {
		expect( keyValToObj() ).to.be.an( 'object' );
	} );

	it( 'sets the specified value at the provided key on the returned object', () => {
		const result = keyValToObj( 'propName', 123456 );
		expect( result ).to.have.property( 'propName' );
		expect( result ).to.deep.equal( {
			propName: 123456
		} );
	} );

	it( 'can be used to set an array, and sets values by reference', () => {
		const arr = [ 'mimsy', 'borogoves', 'outgrabe' ];
		const result = keyValToObj( 'words', arr );
		expect( result ).to.have.property( 'words' );
		expect( result.words ).to.equal( arr );
		expect( result ).to.deep.equal( {
			words: [ 'mimsy', 'borogoves', 'outgrabe' ]
		} );
	} );

} );
