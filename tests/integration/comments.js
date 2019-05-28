'use strict';

const WPRequest = require( '../../lib/constructors/wp-request.js' );

// Variable to use as our 'success token' in promise assertions
const SUCCESS = 'success';

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
const expectedResults = {
	postsAndAuthors: {
		page1: [
			'1170John Doe',
			'1148Jane Doe',
			'1148John Doe',
			'1148John Doe',
			'1148Jane Doe',
			'1148John Doe',
			'1148Joe Bloggs',
			'1148Jane Bloggs',
			'1148Joe Bloggs',
		],
		page2: [
			'1148Jane Bloggs',
			'1148Joe Bloggs',
			'1148Fred Bloggs',
			'1148Fred Bloggs',
			'1148Jane Bloggs',
			'1148John Doe',
			'1148John Doe',
			'1148John Doe',
			'1148Jane Doe',
			'1148Anonymous User',
		],
		page3: [
			'1148John Doe',
			'1149John Doe',
			'155John Doe',
			'155Anon',
			'155tellyworthtest2',
		],
	},
	postsAndAuthorsAsc: {
		page1: [
			'155tellyworthtest2',
			'155Anon',
			'155John Doe',
			'1149John Doe',
			'1148John Doe',
			'1148Anonymous User',
			'1148Jane Doe',
			'1148John Doe',
			'1148John Doe',
			'1148John Doe',
		],
	},
};

// Inspecting the posts and authors of the returned comments arrays is an easy
// way to validate that the right page of results was returned
const getPostsAndAuthors = comments => comments
	.map( comment => comment.post + comment.author_name );

describe.each( [
	[ 'wpapi/superagent', require( '../../superagent' ) ],
	[ 'wpapi/fetch', require( '../../fetch' ) ],
] )( '%s: comments()', ( transportName, WPAPI ) => {
	let wp;

	beforeEach( () => {
		wp = new WPAPI( {
			endpoint: 'http://wpapi.local/wp-json',
		} );
	} );

	it( 'can be used to retrieve a list of comments, omitting a password-protected comment', () => {
		const prom = wp.comments()
			.get()
			.then( ( comments ) => {
				expect( Array.isArray( comments ) ).toBe( true );
				expect( comments.length ).toBe( 9 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'fetches the first page, omitting a password-protected comment', () => {
		const prom = wp.comments()
			.get()
			.then( ( comments ) => {
				expect( getPostsAndAuthors( comments ) ).toEqual( expectedResults.postsAndAuthors.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	it( 'fetches the 10 oldest comments when sorted "asc"', () => {
		const prom = wp.comments()
			.order( 'asc' )
			.get()
			.then( ( comments ) => {
				expect( getPostsAndAuthors( comments ) ).toEqual( expectedResults.postsAndAuthorsAsc.page1 );
				return SUCCESS;
			} );
		return expect( prom ).resolves.toBe( SUCCESS );
	} );

	describe( 'paging properties', () => {

		it( 'are exposed as _paging on the response array', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					expect( posts ).toHaveProperty( '_paging' );
					expect( typeof posts._paging ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of posts', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).toHaveProperty( 'total' );
					expect( posts._paging.total ).toBe( 25 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'include the total number of pages available', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).toHaveProperty( 'totalPages' );
					expect( posts._paging.totalPages ).toBe( 3 );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the next page as .next', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).toHaveProperty( 'next' );
					expect( typeof posts._paging.next ).toBe( 'object' );
					expect( posts._paging.next ).toBeInstanceOf( WPRequest );
					expect( posts._paging.next._options.endpoint )
						.toEqual( 'http://wpapi.local/wp-json/wp/v2/comments?page=2' );
					// Get last page & ensure 'next' no longer appears
					return wp.comments()
						.page( posts._paging.totalPages )
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).not.toHaveProperty( 'next' );
							expect( getPostsAndAuthors( posts ) ).toEqual( expectedResults.postsAndAuthors.page3 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the next page of results via .next', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					return posts._paging.next
						.get()
						.then( ( posts ) => {
							expect( Array.isArray( posts ) ).toBe( true );
							expect( posts.length ).toBe( 10 );
							expect( getPostsAndAuthors( posts ) ).toEqual( expectedResults.postsAndAuthors.page2 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'provides a bound WPRequest for the previous page as .prev', () => {
			const prom = wp.comments()
				.get()
				.then( ( posts ) => {
					expect( posts._paging ).not.toHaveProperty( 'prev' );
					return posts._paging.next
						.get()
						.then( ( posts ) => {
							expect( posts._paging ).toHaveProperty( 'prev' );
							expect( typeof posts._paging.prev ).toBe( 'object' );
							expect( posts._paging.prev ).toBeInstanceOf( WPRequest );
							expect( posts._paging.prev._options.endpoint )
								.toEqual( 'http://wpapi.local/wp-json/wp/v2/comments?page=1' );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'allows access to the previous page of results via .prev', () => {
			const prom = wp.comments()
				.page( 2 )
				.get()
				.then( ( posts ) => {
					expect( getPostsAndAuthors( posts ) ).toEqual( expectedResults.postsAndAuthors.page2 );
					return posts._paging.prev
						.get()
						.then( ( posts ) => {
							expect( Array.isArray( posts ) ).toBe( true );
							// 9 because one comment is for a password-protected post
							expect( posts.length ).toBe( 9 );
							expect( getPostsAndAuthors( posts ) ).toEqual( expectedResults.postsAndAuthors.page1 );
							return SUCCESS;
						} );
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( 'querying by ID', () => {
		let commentCollection;
		let commentId;
		let commentProm;

		beforeEach( () => {
			commentCollection = [];
			commentProm = wp.comments()
				.get()
				.then( ( comments ) => {
					commentCollection = comments;
					commentId = commentCollection[4].id;
					return wp.comments()
						.id( commentId )
						.get();
				} );
		} );

		it( 'returns an object, not an array', () => {
			const prom = commentProm
				.then( ( comment ) => {
					expect( Array.isArray( comment ) ).toBe( false );
					expect( typeof comment ).toBe( 'object' );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns the correct comment', () => {
			const prom = commentProm.then( ( comment ) => {
				expect( comment.id ).toBe( commentId );
				[ 'author_name', 'post', 'parent', 'date', 'status' ].forEach( ( prop ) => {
					expect( comment[ prop ] ).toBe( commentCollection[4][ prop ] );
				} );
				return SUCCESS;
			} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

	describe( '.post() query', () => {
		let pageComments;
		let commentProm;

		beforeEach( () => {
			const pageId = 155;
			commentProm = wp.pages()
				.id( pageId )
				.embed()
				.get()
				.then( ( page ) => {
					// Do a flatten reduction because .replies will be an array of arrays
					pageComments = page._embedded.replies.reduce( ( flatArr, arr ) => flatArr.concat( arr ), [] );
					return wp.comments()
						.post( pageId )
						.get();
				} );
		} );

		it( 'returns an array of posts', () => {
			const prom = commentProm
				.then( ( comments ) => {
					expect( Array.isArray( comments ) ).toBe( true );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns the correct number of comments', () => {
			const prom = commentProm
				.then( ( comments ) => {
					expect( comments.length ).toBe( 3 );
					expect( comments.length ).toBe( pageComments.length );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

		it( 'returns the correct comments', () => {
			const prom = commentProm
				.then( ( comments ) => {
					pageComments.forEach( ( comment, i ) => {
						[ 'id', 'parent', 'author', 'author_name' ].forEach( ( prop ) => {
							expect( comment[ prop ] ).toBe( comments[ i ][ prop ] );
						} );
						expect( comment.content.rendered ).toBe( comments[ i ].content.rendered );
					} );
					return SUCCESS;
				} );
			return expect( prom ).resolves.toBe( SUCCESS );
		} );

	} );

} );
