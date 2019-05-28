'use strict';

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the names of the returned terms is an easy way to validate
// that the right page of results was returned
const getNames = require( '../helpers/get-prop' ).bind( null, 'name' );

// Variable to use as our "success token" in promise assertions
const SUCCESS = 'success';

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the names from tags on the first page)
const expectedResults = {
	names: {
		page1: [
			'8BIT',
			'alignment',
			'Articles',
			'aside',
			'audio',
			'captions',
			'categories',
			'chat',
			'chattels',
			'cienaga',
		],
		page2: [
			'claycold',
			'Codex',
			'comments',
			'content',
			'crushing',
			'css',
			'depo',
			'dinarchy',
			'doolie',
			'dowork',
		],
		pageLast: [
			'trackbacks',
			'twitter',
			'unculpable',
			'Unseen',
			'video',
			'videopress',
			'withered brandnew',
			'WordPress',
			'wordpress.tv',
			'xanthopsia',
		],
	},
};

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: tags()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a collection of category terms', () => {
		const prom = wp.tags()
			.get()
			.then( ( tags ) => {
				expect( Array.isArray( tags ) ).toBe( true );
				expect( tags.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'retrieves the first 10 tags by default', () => {
		const prom = wp.tags()
			.get()
			.then( ( tags ) => {
				expect( Array.isArray( tags ) ).toBe( true );
				expect( tags.length ).toBe( 10 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags ).toHaveProperty( '_paging' );
					expect( typeof tags._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of tags', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).toHaveProperty( 'total' );
					expect( tags._paging.total ).toBe( 110 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).toHaveProperty( 'totalPages' );
					expect( tags._paging.totalPages ).toBe( 11 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).toHaveProperty( 'next' );
					expect( typeof tags._paging.next ).toBe( 'object' );
					expect( tags._paging.next ).toBeInstanceOf( WPRequest );
					expect( tags._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/tags?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.tags().page( tags._paging.totalPages )
						.get()
						.then( ( tags ) => {
							expect( tags._paging ).not.toHaveProperty( 'next' );
							expect( getNames( tags ) ).toEqual( expectedResults.names.pageLast );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					return tags._paging.next
						.get()
						.then( ( tags ) => {
							expect( Array.isArray( tags ) ).toBe( true );
							expect( tags.length ).toBe( 10 );
							expect( getNames( tags ) ).toEqual( expectedResults.names.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).not.toHaveProperty( 'prev' );
					return tags._paging.next
						.get()
						.then( ( tags ) => {
							expect( tags._paging ).toHaveProperty( 'prev' );
							expect( typeof tags._paging.prev ).toBe( 'object' );
							expect( tags._paging.prev ).toBeInstanceOf( WPRequest );
							expect( tags._paging.prev._options.endpoint )
								.toEqual( 'http://wpapi.local/wp-json/wp/v2/tags?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.tags()
				.page( 2 )
				.get()
				.then( ( tags ) => {
					expect( getNames( tags ) ).toEqual( expectedResults.names.page2 );
					return tags._paging.prev
						.get()
						.then( ( tags ) => {
							expect( Array.isArray( tags ) ).toBe( true );
							expect( tags.length ).toBe( 10 );
							expect( getNames( tags ) ).toEqual( expectedResults.names.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'id()', () => {

		it( 'can be used to access an individual tag term', () => {
			let selectedTag;
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					// Pick one of the tags
					selectedTag = tags[ 3 ];
					// Query for that tag directly
					return wp.tags().id( selectedTag.id );
				} )
				.then( ( tag ) => {
					expect( typeof tag ).toBe( 'object' );
					expect( tag ).toHaveProperty( 'id' );
					expect( tag.id ).toBe( selectedTag.id );
					expect( tag ).toHaveProperty( 'slug' );
					expect( tag.slug ).toBe( selectedTag.slug );
					expect( tag ).toHaveProperty( 'taxonomy' );
					expect( tag.taxonomy ).toBe( 'post_tag' );
					expect( tag ).not.toHaveProperty( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'search()', () => {

		it( 'can be used to retrieve a tag by slug', () => {
			let selectedTag;
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					// Pick one of the tags
					selectedTag = tags[ 3 ];
					// Search for that tag by slug
					return wp.tags().search( selectedTag.slug );
				} )
				.then( ( tags ) => {
					expect( Array.isArray( tags ) ).toBe( true );
					expect( tags.length ).toBe( 1 );
					return tags[ 0 ];
				} )
				.then( ( tag ) => {
					expect( typeof tag ).toBe( 'object' );
					expect( tag ).toHaveProperty( 'id' );
					expect( tag.id ).toBe( selectedTag.id );
					expect( tag ).toHaveProperty( 'slug' );
					expect( tag.slug ).toBe( selectedTag.slug );
					expect( tag ).toHaveProperty( 'taxonomy' );
					expect( tag.taxonomy ).toBe( 'post_tag' );
					expect( tag ).not.toHaveProperty( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns all tags matching the provided search string', () => {
			const prom = wp.tags()
				.search( 'post' )
				.get()
				.then( ( tags ) => {
					expect( Array.isArray( tags ) ).toBe( true );
					expect( tags.length ).toBe( 2 );
					const slugs = tags.map( tag => tag.slug ).sort().join( ' ' );
					expect( slugs ).toBe( 'post post-formats' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'can be used to retrieve a tag by slug from a set of search results', () => {
			const prom = wp.tags()
				.search( 'post' )
				.get()
				// Iterating over response of search is the best we can do until
				// filtering for taxonomy term collections is reinstated
				.then( tags => tags.find( tag => tag.slug === 'post' ) )
				.then( ( tag ) => {
					expect( tag ).toHaveProperty( 'slug' );
					expect( tag.slug ).toBe( 'post' );
					expect( tag ).toHaveProperty( 'name' );
					expect( tag.name ).toBe( 'post' );
					expect( tag ).not.toHaveProperty( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
