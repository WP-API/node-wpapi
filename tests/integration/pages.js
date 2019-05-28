'use strict';

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
const getTitles = require( '../helpers/get-rendered-prop' ).bind( null, 'title' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from pages on the first page)
const expectedResults = {
	titles: {
		page1: [
			'Page Markup And Formatting',
			'Page Image Alignment',
			'Level 3b',
			'Level 3a',
			'Level 2b',
			'Level 2a',
			'Page B',
			'Page A',
			'Blog',
			'Front Page',
		],
		page2: [
			'Clearing Floats',
			'About The Tests',
			'Level 1',
			'Level 2',
			'Level 3',
			'Page with comments disabled',
			'Page with comments',
			'Lorem Ipsum',
		],
	},
};

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: pages()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a list of recent pages', () => {
		const prom = wp.pages()
			.get()
			.then( ( pages ) => {
				expect( Array.isArray( pages ) ).toBe( true );
				expect( pages.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'fetches the 10 most recent pages by default', () => {
		const prom = wp.pages()
			.get()
			.then( ( pages ) => {
				expect( getTitles( pages ) ).toEqual( expectedResults.titles.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.pages()
				.get()
				.then( ( pages ) => {
					expect( pages ).toHaveProperty( '_paging' );
					expect( typeof pages._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages', () => {
			const prom = wp.pages()
				.get()
				.then( ( pages ) => {
					expect( pages._paging ).toHaveProperty( 'total' );
					expect( pages._paging.total ).toBe( 18 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.pages()
				.get()
				.then( ( pages ) => {
					expect( pages._paging ).toHaveProperty( 'totalPages' );
					expect( pages._paging.totalPages ).toBe( 2 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.pages()
				.get()
				.then( ( pages ) => {
					expect( pages._paging ).toHaveProperty( 'next' );
					expect( typeof pages._paging.next ).toBe( 'object' );
					expect( pages._paging.next ).toBeInstanceOf( WPRequest );
					expect( pages._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/pages?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.pages()
						.page( pages._paging.totalPages )
						.get()
						.then( ( pages ) => {
							expect( pages._paging ).not.toHaveProperty( 'next' );
							expect( getTitles( pages ) ).toEqual( expectedResults.titles.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.pages()
				.get()
				.then( pages => pages._paging.next.get() )
				.then( ( pages ) => {
					expect( Array.isArray( pages ) ).toBe( true );
					expect( pages.length ).toBe( 8 );
					expect( getTitles( pages ) ).toEqual( expectedResults.titles.page2 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.pages()
				.get()
				.then( ( pages ) => {
					expect( pages._paging ).not.toHaveProperty( 'prev' );
					return pages._paging.next.get();
				} )
				.then( ( pages ) => {
					expect( pages._paging ).toHaveProperty( 'prev' );
					expect( typeof pages._paging.prev ).toBe( 'object' );
					expect( pages._paging.prev ).toBeInstanceOf( WPRequest );
					expect( pages._paging.prev._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/pages?page=1' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.pages()
				.page( 2 )
				.get()
				.then( ( pages ) => {
					expect( getTitles( pages ) ).toEqual( expectedResults.titles.page2 );
					return pages._paging.prev.get();
				} )
				.then( ( pages ) => {
					expect( Array.isArray( pages ) ).toBe( true );
					expect( pages.length ).toBe( 10 );
					expect( getTitles( pages ) ).toEqual( expectedResults.titles.page1 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'filter methods', () => {

		describe( 'slug', () => {

			it( 'can be used to return only pages with the specified slug', () => {
				const prom = wp.pages()
					.slug( 'clearing-floats' )
					.get()
					.then( ( pages ) => {
						expect( pages.length ).toBe( 1 );
						expect( getTitles( pages ) ).toEqual( [
							'Clearing Floats',
						] );
						return SUCCESS;
					} );
				return expect( prom ).resolves.toBe( SUCCESS );
			} );

		} );

	} );

} );
