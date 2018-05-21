'use strict';
var chai = require( 'chai' );
var sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );
var expect = chai.expect;

var paramSetter = require( '../../../../lib/util/parameter-setter' );

describe( 'parameterSetter utility', () => {
	var obj;

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
