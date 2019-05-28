'use strict';

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: types()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a dictionary of registered types', () => {
		const prom = wp.types()
			.get()
			.then( ( types ) => {
				expect( typeof types ).toBe( 'object' );
				expect( types ).toHaveProperty( 'post' );
				expect( typeof types.post ).toBe( 'object' );
				expect( types ).toHaveProperty( 'page' );
				expect( typeof types.page ).toBe( 'object' );
				expect( types ).toHaveProperty( 'attachment' );
				expect( typeof types.attachment ).toBe( 'object' );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be chained with a type() call to fetch the "post" type', () => {
		const prom = wp.types()
			.type( 'post' )
			.get()
			.then( ( post ) => {
				expect( typeof post ).toBe( 'object' );
				expect( post ).toHaveProperty( 'slug' );
				expect( post.slug ).toBe( 'post' );
				expect( post ).toHaveProperty( 'hierarchical' );
				expect( post.hierarchical ).toBe( false );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'can be chained with a type() call to fetch the page type', () => {
		const prom = wp.types()
			.type( 'page' )
			.get()
			.then( ( page ) => {
				expect( typeof page ).toBe( 'object' );
				expect( page ).toHaveProperty( 'slug' );
				expect( page.slug ).toBe( 'page' );
				expect( page ).toHaveProperty( 'hierarchical' );
				expect( page.hierarchical ).toBe( true );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

} );
