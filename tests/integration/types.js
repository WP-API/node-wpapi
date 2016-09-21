'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WPAPI = require( '../../' );

describe( 'integration: types()', function() {
	var wp;

	beforeEach(function() {
		wp = new WPAPI({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a dictionary of registered types', function() {
		var prom = wp.types()
			.get()
			.then(function( types ) {
				expect( types ).to.be.an( 'object' );
				expect( types ).to.have.property( 'post' );
				expect( types.post ).to.be.an( 'object' );
				expect( types ).to.have.property( 'page' );
				expect( types.page ).to.be.an( 'object' );
				expect( types ).to.have.property( 'attachment' );
				expect( types.attachment ).to.be.an( 'object' );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can be chained with a type() call to fetch the "post" type', function() {
		var prom = wp.types()
			.type( 'post' )
			.get()
			.then(function( post ) {
				expect( post ).to.be.an( 'object' );
				expect( post ).to.have.property( 'slug' );
				expect( post.slug ).to.equal( 'post' );
				expect( post ).to.have.property( 'hierarchical' );
				expect( post.hierarchical ).to.equal( false );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can be chained with a type() call to fetch the page type', function() {
		var prom = wp.types()
			.type( 'page' )
			.get()
			.then(function( page ) {
				expect( page ).to.be.an( 'object' );
				expect( page ).to.have.property( 'slug' );
				expect( page.slug ).to.equal( 'page' );
				expect( page ).to.have.property( 'hierarchical' );
				expect( page.hierarchical ).to.equal( true );
				return SUCCESS;
			});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

});
