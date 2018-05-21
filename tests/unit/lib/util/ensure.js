'use strict';
const { expect } = require( 'chai' );

const ensure = require( '../../../../lib/util/ensure' );

describe( 'ensure utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	} );

	it( 'is defined', () => {
		expect( ensure ).to.exist;
	} );

	it( 'is a function', () => {
		expect( ensure ).to.be.a( 'function' );
	} );

	it( 'sets a default property value on an object', () => {
		expect( obj ).not.to.have.property( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).to.have.property( 'foo' );
		expect( obj.foo ).to.be.a( 'string' );
		expect( obj.foo ).to.equal( 'bar' );
	} );

	it( 'will not overwrite an existing value on an object', () => {
		obj.foo = 'baz';
		expect( obj ).to.have.property( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).to.have.property( 'foo' );
		expect( obj.foo ).to.be.a( 'string' );
		expect( obj.foo ).to.equal( 'baz' );
	} );

	it( 'will not overwrite a falsy value on an object', () => {
		obj.foo = 0;
		expect( obj ).to.have.property( 'foo' );
		ensure( obj, 'foo', 'bar' );
		expect( obj ).to.have.property( 'foo' );
		expect( obj.foo ).to.be.a( 'number' );
		expect( obj.foo ).to.equal( 0 );
	} );

} );
