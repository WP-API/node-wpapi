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
const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Inspecting the names of the returned terms is an easy way to validate
// that the right page of results was returned
const getNames = require( './helpers/get-prop' ).bind( null, 'name' );

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

describe( 'integration: tags()', () => {
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
				expect( tags ).to.be.an( 'array' );
				expect( tags.length ).to.equal( 10 );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	it( 'retrieves the first 10 tags by default', () => {
		const prom = wp.tags()
			.get()
			.then( ( tags ) => {
				expect( tags ).to.be.an( 'array' );
				expect( tags.length ).to.equal( 10 );
				return SUCCESS;
			} );
		return expect( prom ).to.eventually.equal( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags ).to.have.property( '_paging' );
					expect( tags._paging ).to.be.an( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'include the total number of tags', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).to.have.property( 'total' );
					expect( tags._paging.total ).to.equal( '110' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).to.have.property( 'totalPages' );
					expect( tags._paging.totalPages ).to.equal( '11' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).to.have.property( 'next' );
					expect( tags._paging.next ).to.be.an( 'object' );
					expect( tags._paging.next ).to.be.an.instanceOf( WPRequest );
					expect( tags._paging.next._options.endpoint ).to
						.equal( 'http://wpapi.local/wp-json/wp/v2/tags?page=2' );
					// Get last page & ensure "next" no longer appears
					return wp.tags().page( tags._paging.totalPages )
						.get()
						.then( ( tags ) => {
							expect( tags._paging ).not.to.have.property( 'next' );
							expect( getNames( tags ) ).to.deep.equal( expectedResults.names.pageLast );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					return tags._paging.next
						.get()
						.then( ( tags ) => {
							expect( tags ).to.be.an( 'array' );
							expect( tags.length ).to.equal( 10 );
							expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.tags()
				.get()
				.then( ( tags ) => {
					expect( tags._paging ).not.to.have.property( 'prev' );
					return tags._paging.next
						.get()
						.then( ( tags ) => {
							expect( tags._paging ).to.have.property( 'prev' );
							expect( tags._paging.prev ).to.be.an( 'object' );
							expect( tags._paging.prev ).to.be.an.instanceOf( WPRequest );
							expect( tags._paging.prev._options.endpoint ).to
								.equal( 'http://wpapi.local/wp-json/wp/v2/tags?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.tags()
				.page( 2 )
				.get()
				.then( ( tags ) => {
					expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page2 );
					return tags._paging.prev
						.get()
						.then( ( tags ) => {
							expect( tags ).to.be.an( 'array' );
							expect( tags.length ).to.equal( 10 );
							expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
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
					expect( tag ).to.be.an( 'object' );
					expect( tag ).to.have.property( 'id' );
					expect( tag.id ).to.equal( selectedTag.id );
					expect( tag ).to.have.property( 'slug' );
					expect( tag.slug ).to.equal( selectedTag.slug );
					expect( tag ).to.have.property( 'taxonomy' );
					expect( tag.taxonomy ).to.equal( 'post_tag' );
					expect( tag ).not.to.have.property( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
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
					expect( tags ).to.be.an( 'array' );
					expect( tags.length ).to.equal( 1 );
					return tags[ 0 ];
				} )
				.then( ( tag ) => {
					expect( tag ).to.be.an( 'object' );
					expect( tag ).to.have.property( 'id' );
					expect( tag.id ).to.equal( selectedTag.id );
					expect( tag ).to.have.property( 'slug' );
					expect( tag.slug ).to.equal( selectedTag.slug );
					expect( tag ).to.have.property( 'taxonomy' );
					expect( tag.taxonomy ).to.equal( 'post_tag' );
					expect( tag ).not.to.have.property( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'returns all tags matching the provided search string', () => {
			const prom = wp.tags()
				.search( 'post' )
				.get()
				.then( ( tags ) => {
					expect( tags ).to.be.an( 'array' );
					expect( tags.length ).to.equal( 2 );
					const slugs = tags.map( tag => tag.slug ).sort().join( ' ' );
					expect( slugs ).to.equal( 'post post-formats' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

		it( 'can be used to retrieve a tag by slug from a set of search results', () => {
			const prom = wp.tags()
				.search( 'post' )
				.get()
				// Iterating over response of search is the best we can do until
				// filtering for taxonomy term collections is reinstated
				.then( tags => tags.find( tag => tag.slug === 'post' ) )
				.then( ( tag ) => {
					expect( tag ).to.have.property( 'slug' );
					expect( tag.slug ).to.equal( 'post' );
					expect( tag ).to.have.property( 'name' );
					expect( tag.name ).to.equal( 'post' );
					expect( tag ).not.to.have.property( 'parent' );
					return SUCCESS;
				} );
			return expect( prom ).to.eventually.equal( SUCCESS );
		} );

	} );

} );
