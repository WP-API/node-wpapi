'use strict';

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: taxonomies()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a dictionary of registered taxonomies', () => {
		const prom = wp.taxonomies()
			.get()
			.then( ( taxonomies ) => {
				expect( typeof taxonomies ).toBe( 'object' );
				expect( taxonomies ).toHaveProperty( 'category' );
				expect( typeof taxonomies.category ).toBe( 'object' );
				expect( taxonomies ).toHaveProperty( 'post_tag' );
				expect( typeof taxonomies.post_tag ).toBe( 'object' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be chained with a taxonomy() call to fetch the category taxonomy', () => {
		const prom = wp.taxonomies()
			.taxonomy( 'category' )
			.get()
			.then( ( category ) => {
				expect( typeof category ).toBe( 'object' );
				expect( category ).toHaveProperty( 'slug' );
				expect( category.slug ).toBe( 'category' );
				expect( category ).toHaveProperty( 'hierarchical' );
				expect( category.hierarchical ).toBe( true );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be chained with a taxonomy() call to fetch the post_tag taxonomy', () => {
		const prom = wp.taxonomies()
			.taxonomy( 'post_tag' )
			.get()
			.then( ( tag ) => {
				expect( typeof tag ).toBe( 'object' );
				expect( tag ).toHaveProperty( 'slug' );
				expect( tag.slug ).toBe( 'post_tag' );
				expect( tag ).toHaveProperty( 'hierarchical' );
				expect( tag.hierarchical ).toBe( false );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
