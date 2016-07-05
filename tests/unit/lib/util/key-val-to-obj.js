'use strict';
var expect = require( 'chai' ).expect;

var keyValToObj = require( '../../../../lib/util/key-val-to-obj' );

describe( 'keyValToObj utility', function() {
	var obj;

	beforeEach(function() {
		obj = {};
	});

	it( 'is defined', function() {
		expect( keyValToObj ).to.exist;
	});

	it( 'is a function', function() {
		expect( keyValToObj ).to.be.a( 'function' );
	});

	it( 'returns an object', function() {
		expect( keyValToObj() ).to.be.an( 'object' );
	});

	it( 'sets the specified value at the provided key on the returned object', function() {
		var result = keyValToObj( 'propName', 123456 );
		expect( result ).to.have.property( 'propName' );
		expect( result ).to.deep.equal({
			propName: 123456
		});
	});

	it( 'can be used to set an array, and sets values by reference', function() {
		var arr = [ 'mimsy', 'borogoves', 'outgrabe' ];
		var result = keyValToObj( 'words', arr );
		expect( result ).to.have.property( 'words' );
		expect( result.words ).to.equal( arr );
		expect( result ).to.deep.equal({
			words: [ 'mimsy', 'borogoves', 'outgrabe' ]
		});
	});

});
