'use strict';

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the names of the returned categories is an easy way to validate
// that the right page of results was returned
const getNames = require( '../helpers/get-prop' ).bind( null, 'name' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the names from categories on the first page)
const expectedResults = {
	names: {
		page1: [
			'aciform',
			'antiquarianism',
			'arrangement',
			'asmodeus',
			'Blogroll',
			'broder',
			'buying',
			'Cat A',
			'Cat B',
			'Cat C',
		],
		page2: [
			'championship',
			'chastening',
			'Child 1',
			'Child 2',
			'Child Category 01',
			'Child Category 02',
			'Child Category 03',
			'Child Category 04',
			'Child Category 05',
			'clerkship',
		],
		pageLast: [
			'ween',
			'wellhead',
			'wellintentioned',
			'whetstone',
			'years',
		],
	},
};

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: categories()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a collection of category terms', () => {
		const prom = wp.categories()
			.get()
			.then( ( categories ) => {
				expect( Array.isArray( categories ) ).toBe( true );
				expect( categories.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'retrieves the first 10 categories by default', () => {
		const prom = wp.categories()
			.get()
			.then( ( categories ) => {
				expect( Array.isArray( categories ) ).toBe( true );
				expect( categories.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					expect( categories ).toHaveProperty( '_paging' );
					expect( typeof categories._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of categories', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					expect( categories._paging ).toHaveProperty( 'total' );
					expect( categories._paging.total ).toBe( 65 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					expect( categories._paging ).toHaveProperty( 'totalPages' );
					expect( categories._paging.totalPages ).toBe( 7 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					expect( categories._paging ).toHaveProperty( 'next' );
					expect( typeof categories._paging.next ).toBe( 'object' );
					expect( categories._paging.next ).toBeInstanceOf( WPRequest );
					expect( categories._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/categories?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.categories()
						.page( categories._paging.totalPages )
						.get()
						.then( ( categories ) => {
							expect( categories._paging ).not.toHaveProperty( 'next' );
							expect( getNames( categories ) ).toEqual( expectedResults.names.pageLast );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					return categories._paging.next
						.get()
						.then( ( categories ) => {
							expect( Array.isArray( categories ) ).toBe( true );
							expect( categories.length ).toBe( 10 );
							expect( getNames( categories ) ).toEqual( expectedResults.names.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					expect( categories._paging ).not.toHaveProperty( 'prev' );
					return categories._paging.next
						.get()
						.then( ( categories ) => {
							expect( categories._paging ).toHaveProperty( 'prev' );
							expect( typeof categories._paging.prev ).toBe( 'object' );
							expect( categories._paging.prev ).toBeInstanceOf( WPRequest );
							expect( categories._paging.prev._options.endpoint )
								.toEqual( 'http://wpapi.local/wp-json/wp/v2/categories?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.categories()
				.page( 2 )
				.get()
				.then( ( categories ) => {
					expect( getNames( categories ) ).toEqual( expectedResults.names.page2 );
					return categories._paging.prev
						.get()
						.then( ( categories ) => {
							expect( Array.isArray( categories ) ).toBe( true );
							expect( categories.length ).toBe( 10 );
							expect( getNames( categories ) ).toEqual( expectedResults.names.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'id()', () => {

		it( 'can be used to access an individual category term', () => {
			let selectedCategory;
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					// Pick one of the categories
					selectedCategory = categories[ 3 ];
					// Query for that category directly
					return wp.categories().id( selectedCategory.id );
				} )
				.then( ( category ) => {
					expect( typeof category ).toBe( 'object' );
					expect( category ).toHaveProperty( 'id' );
					expect( category.id ).toBe( selectedCategory.id );
					expect( category ).toHaveProperty( 'slug' );
					expect( category.slug ).toBe( selectedCategory.slug );
					expect( category ).toHaveProperty( 'taxonomy' );
					expect( category.taxonomy ).toBe( 'category' );
					expect( category ).toHaveProperty( 'parent' );
					expect( category.parent ).toBe( 0 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'search()', () => {

		it( 'can be used to retrieve a category by slug', () => {
			let selectedCategory;
			const prom = wp.categories()
				.get()
				.then( ( categories ) => {
					// Pick one of the categories
					selectedCategory = categories[ 3 ];
					// Search for that category by slug
					return wp.categories().search( selectedCategory.slug );
				} )
				.then( ( categories ) => {
					expect( Array.isArray( categories ) ).toBe( true );
					expect( categories.length ).toBe( 1 );
					return categories[ 0 ];
				} )
				.then( ( category ) => {
					expect( typeof category ).toBe( 'object' );
					expect( category ).toHaveProperty( 'id' );
					expect( category.id ).toBe( selectedCategory.id );
					expect( category ).toHaveProperty( 'slug' );
					expect( category.slug ).toBe( selectedCategory.slug );
					expect( category ).toHaveProperty( 'taxonomy' );
					expect( category.taxonomy ).toBe( 'category' );
					expect( category ).toHaveProperty( 'parent' );
					expect( category.parent ).toBe( 0 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns all categories matching the provided search string', () => {
			const prom = wp.categories()
				.search( 'parent' )
				.get()
				.then( ( categories ) => {
					expect( Array.isArray( categories ) ).toBe( true );
					expect( categories.length ).toBe( 4 );
					const slugs = categories.map( cat => cat.slug ).sort().join( ' ' );
					expect( slugs ).toBe( 'foo-a-foo-parent foo-parent parent parent-category' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'can be used to retrieve a category by slug from a set of search results', () => {
			const prom = wp.categories()
				.search( 'parent' )
				.get()
				// Iterating over response of search is the best we can do until
				// filtering for taxonomy term collections is reinstated
				.then( categories => categories.find( cat => cat.slug === 'parent' ) )
				.then( ( category ) => {
					expect( category ).toHaveProperty( 'slug' );
					expect( category.slug ).toBe( 'parent' );
					expect( category ).toHaveProperty( 'name' );
					expect( category.name ).toBe( 'Parent' );
					expect( category ).toHaveProperty( 'parent' );
					expect( category.parent ).toBe( 0 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'parent()', () => {

		it( 'can be used to retrieve direct children of a specific category', () => {
			let parentCat;
			let childCat1;
			let childCat2;
			// First, find the "parent" category
			const prom = wp.categories()
				.search( 'parent' )
				.get()
				.then( ( categories ) => {
					parentCat = categories.find( cat => cat.slug === 'parent' );
					return wp.categories().parent( parentCat.id );
				} )
				.then( ( categories ) => {
					expect( Array.isArray( categories ) ).toBe( true );
					expect( categories.length ).toBe( 1 );
					const category = categories[ 0 ];
					expect( category ).toHaveProperty( 'name' );
					expect( category.name ).toBe( 'Child 1' );
					expect( category ).toHaveProperty( 'parent' );
					expect( category.parent ).toBe( parentCat.id );
					childCat1 = category;
					// Go one level deeper
					return wp.categories().parent( childCat1.id );
				} )
				.then( ( categories ) => {
					expect( Array.isArray( categories ) ).toBe( true );
					expect( categories.length ).toBe( 1 );
					const category = categories[ 0 ];
					expect( category ).toHaveProperty( 'name' );
					expect( category.name ).toBe( 'Child 2' );
					expect( category ).toHaveProperty( 'parent' );
					expect( category.parent ).toBe( childCat1.id );
					childCat2 = category;
					// Go one level deeper
					return wp.categories().parent( childCat2.id );
				} )
				.then( ( categories ) => {
					expect( Array.isArray( categories ) ).toBe( true );
					expect( categories.length ).toBe( 0 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( '.post()', () => {

		it( 'can be used to retrieve terms for a specific post', () => {
			let postCategories;
			const prom = wp.posts()
				.perPage( 1 )
				.embed()
				.get()
				.then( ( posts ) => {
					const post = posts[ 0 ];
					// Find the categories for this post
					post._embedded['wp:term'].forEach( ( terms ) => {
						if ( terms.length && terms[ 0 ].taxonomy === 'category' ) {
							postCategories = terms;
						}
					} );
					const postId = post.id;
					return wp.categories().post( postId );
				} )
				.then( ( categories ) => {
					expect( categories.length ).toBe( postCategories.length );
					categories.forEach( ( cat, idx ) => {
						[
							'id',
							'name',
							'slug',
							'taxonomy',
						].forEach( ( prop ) => {
							expect( cat[ prop ] ).toBe( postCategories[ idx ][ prop ] );
						} );
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
