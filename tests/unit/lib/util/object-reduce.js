'use strict';
var expect = require( 'chai' ).expect;

describe( 'Object reduction tools:', function() {
	// Ensure parity with the relevant signature & functionality of lodash.reduce
	[
		{
			name: 'lodash.reduce (for API parity verification)',
			fn: require( 'lodash.reduce' )
		}, {
			name: 'objectReduce utility',
			fn: require( '../../../../lib/util/object-reduce' )
		}
	].forEach(function( test ) {

		describe( test.name, function() {
			var objectReduce = test.fn;
			var obj;

			beforeEach(function() {
				obj = {};
			});

			it( 'is defined', function() {
				expect( objectReduce ).to.exist;
			});

			it( 'is a function', function() {
				expect( objectReduce ).to.be.a( 'function' );
			});

			it( 'resolves to the provided initial value if called on an empty object', function() {
				expect( objectReduce( {}, function() {}, 'Sasquatch' ) ).to.equal( 'Sasquatch' );
			});

			it( 'can be used to reduce over an object', function() {
				var result = objectReduce({
					key1: 'val1',
					key2: 'val2',
					key3: 'val3'
				}, function( memo, val, key ) {
					return memo + val + key;
				}, 'result:' );
				expect( result ).to.equal( 'result:val1key1val2key2val3key3' );
			});

		});

	});

});
