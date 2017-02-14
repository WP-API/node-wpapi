'use strict';
var expect = require( 'chai' ).expect;

var isEmptyObject = require( '../../../../lib/util/is-empty-object' );

describe( 'isEmptyObject utility', function() {

	it( 'is defined', function() {
		expect( isEmptyObject ).to.exist;
	});

	it( 'is a function', function() {
		expect( isEmptyObject ).to.be.a( 'function' );
	});

	it( 'returns true if passed an empty object', function() {
		expect( isEmptyObject( {} ) ).to.equal( true );
	});

	it( 'returns true if passed a constructed object with no instance properties', function() {
		function Ctor() {}
		Ctor.prototype.prop = 'val';
		expect( isEmptyObject( new Ctor() ) ).to.equal( true );
	});

	it( 'returns false if passed an object with own properties', function() {
		expect( isEmptyObject({ prop: 'value' }) ).to.equal( false );
	});

	it( 'returns false if passed a constructed object with instance properties', function() {
		function Ctor() {
			this.prop = 'val';
		}
		expect( isEmptyObject( new Ctor() ) ).to.equal( false );
	});

	it( 'returns false if passed a string', function() {
		expect( isEmptyObject( '{}' ) ).to.equal( false );
	});

	it( 'returns false if passed an empty array', function() {
		expect( isEmptyObject( [] ) ).to.equal( false );
	});

	it( 'returns false if passed a boolean', function() {
		expect( isEmptyObject( true ) ).to.equal( false );
		expect( isEmptyObject( false ) ).to.equal( false );
	});

	it( 'returns false if passed a number', function() {
		expect( isEmptyObject( 0 ) ).to.equal( false );
		expect( isEmptyObject( 1337 ) ).to.equal( false );
	});

});
