'use strict';
const { expect } = require( 'chai' );

const applyMixin = require( '../../../../lib/util/apply-mixin' );

describe( 'applyMixin utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	});

	it( 'is a function', () => {
		expect( applyMixin ).to.be.a( 'function' );
	});

	it( 'returns nothing', () => {
		expect( applyMixin() ).to.be.undefined;
	});

	it( 'assigns a method to the provided object', () => {
		function bar() {}
		applyMixin( obj, 'foo', bar );
		expect( obj ).to.deep.equal({
			foo: bar
		});
	});

	it( 'does not mutate the object if the specified key exists already', () => {
		obj.foo = 'bar';
		applyMixin( obj, 'foo', () => {});
		expect( obj ).to.deep.equal({
			foo: 'bar'
		});
	});

	it( 'does not mutate the object if third arg is not a function', () => {
		applyMixin( obj, 'key', 'not a function' );
		expect( obj ).to.deep.equal({});
	});

});
