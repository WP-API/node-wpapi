'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WP = require( '../../' );

describe( 'integration: taxonomies()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a dictionary of registered taxonomies', function() {
		var prom = wp.taxonomies().get().then(function( taxonomies ) {
			expect( taxonomies ).to.be.an( 'object' );
			expect( Object.keys( taxonomies ).length ).to.equal( 2 );
			expect( taxonomies ).to.have.property( 'category' );
			expect( taxonomies ).to.have.property( 'post_tag' );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can be chained with a taxonomy() call to fetch the category taxonomy', function() {
		var prom = wp.taxonomies().taxonomy( 'category' ).get().then(function( category ) {
			expect( category ).to.be.an( 'object' );
			expect( category ).to.have.property( 'slug' );
			expect( category.slug ).to.equal( 'category' );
			expect( category ).to.have.property( 'hierarchical' );
			expect( category.hierarchical ).to.equal( true );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'can be chained with a taxonomy() call to fetch the post_tag taxonomy', function() {
		var prom = wp.taxonomies().taxonomy( 'post_tag' ).get().then(function( tag ) {
			expect( tag ).to.be.an( 'object' );
			expect( tag ).to.have.property( 'slug' );
			expect( tag.slug ).to.equal( 'post_tag' );
			expect( tag ).to.have.property( 'hierarchical' );
			expect( tag.hierarchical ).to.equal( false );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

});
