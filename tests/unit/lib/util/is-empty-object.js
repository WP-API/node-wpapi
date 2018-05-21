'use strict';
const { expect } = require( 'chai' );

const isEmptyObject = require( '../../../../lib/util/is-empty-object' );

describe( 'isEmptyObject utility', () => {

	it( 'is defined', () => {
		expect( isEmptyObject ).to.exist;
	} );

	it( 'is a function', () => {
		expect( isEmptyObject ).to.be.a( 'function' );
	} );

	it( 'returns true if passed an empty object', () => {
		expect( isEmptyObject( {} ) ).to.equal( true );
	} );

	it( 'returns true if passed a constructed object with no instance properties', () => {
		function Ctor() {}
		Ctor.prototype.prop = 'val';
		expect( isEmptyObject( new Ctor() ) ).to.equal( true );
	} );

	it( 'returns false if passed an object with own properties', () => {
		expect( isEmptyObject( { prop: 'value' } ) ).to.equal( false );
	} );

	it( 'returns false if passed a constructed object with instance properties', () => {
		function Ctor() {
			this.prop = 'val';
		}
		expect( isEmptyObject( new Ctor() ) ).to.equal( false );
	} );

	it( 'returns false if passed a string', () => {
		expect( isEmptyObject( '{}' ) ).to.equal( false );
	} );

	it( 'returns false if passed an empty array', () => {
		expect( isEmptyObject( [] ) ).to.equal( false );
	} );

	it( 'returns false if passed a boolean', () => {
		expect( isEmptyObject( true ) ).to.equal( false );
		expect( isEmptyObject( false ) ).to.equal( false );
	} );

	it( 'returns false if passed a number', () => {
		expect( isEmptyObject( 0 ) ).to.equal( false );
		expect( isEmptyObject( 1337 ) ).to.equal( false );
	} );

} );
