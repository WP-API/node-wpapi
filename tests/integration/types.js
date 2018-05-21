'use strict';
const chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
const expect = chai.expect;

const WPAPI = require( '../../' );

describe( 'integration: types()', () => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.loc/wp-json'
		} );
	} );

	it( 'can be used to retrieve a dictionary of registered types', () => {
		const prom = wp.types()
			.get()
			.then( ( types ) => {
				expect( types ).to.be.an( 'object' );
				expect( types ).to.have.property( 'post' );
				expect( types.post ).to.be.an( 'object' );
				expect( types ).to.have.property( 'page' );
				expect( types.page ).to.be.an( 'object' );
				expect( types ).to.have.property( 'attachment' );
				expect( types.attachment ).to.be.an( 'object' );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'can be chained with a type() call to fetch the "post" type', () => {
		const prom = wp.types()
			.type( 'post' )
			.get()
			.then( ( post ) => {
				expect( post ).to.be.an( 'object' );
				expect( post ).to.have.property( 'slug' );
				expect( post.slug ).to.equal( 'post' );
				expect( post ).to.have.property( 'hierarchical' );
				expect( post.hierarchical ).to.equal( false );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'can be chained with a type() call to fetch the page type', () => {
		const prom = wp.types()
			.type( 'page' )
			.get()
			.then( ( page ) => {
				expect( page ).to.be.an( 'object' );
				expect( page ).to.have.property( 'slug' );
				expect( page.slug ).to.equal( 'page' );
				expect( page ).to.have.property( 'hierarchical' );
				expect( page.hierarchical ).to.equal( true );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

} );
