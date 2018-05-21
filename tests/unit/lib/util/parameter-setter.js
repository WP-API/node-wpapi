'use strict';
const chai = require( 'chai' );
const sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );
const expect = chai.expect;

const paramSetter = require( '../../../../lib/util/parameter-setter' );

describe( 'parameterSetter utility', () => {
	let obj;

	beforeEach( () => {
		obj = {};
	});

	it( 'is a function', () => {
		expect( paramSetter ).to.be.a( 'function' );
	});

	it( 'returns a function', () => {
		expect( paramSetter() ).to.be.a( 'function' );
	});

	it( 'creates a setter that calls this.param()', () => {
		obj.param = sinon.stub();
		obj.setter = paramSetter( 'foo' );
		obj.setter( 'bar' );
		expect( obj.param ).to.have.been.calledWith( 'foo', 'bar' );
	});

});
