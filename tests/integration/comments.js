'use strict';
/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
var chai = require( 'chai' );
// Variable to use as our 'success token' in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WP = require( '../../' );
var WPRequest = require( '../../lib/constructors/wp-request.js' );

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
var expectedResults = {
	postsAndAuthors: {
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
			'1148John Doe'
		],
		page2: [
			'1148Jane Bloggs',
			'1148Fred Bloggs',
			'1148Fred Bloggs',
			'1148Joe Bloggs',
			'1148Jane Bloggs',
			'1148Joe Bloggs',
			'1148Jane Bloggs',
			'1148Joe Bloggs',
			'1148John Doe',
			'1148Jane Doe'
		],
		page3: [
			'1148John Doe',
			'1148John Doe',
			'1148Jane Doe',
			'1168Jane Doe',
			'1170John Doe'
		]
	}
};

// Inspecting the posts and authors of the returned comments arrays is an easy
// way to validate that the right page of results was returned
function getPostsAndAuthors( posts ) {
	return posts.map(function( post ) {
		return post.post + post.author_name;
	});
}

describe( 'integration: comments()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a list of recent comments', function() {
		var prom = wp.comments().get().then(function( comments ) {
			expect( comments ).to.be.an( 'array' );
			expect( comments.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'fetches the 10 most recent comments by default', function() {
		var prom = wp.comments().get().then(function( comments ) {
			expect( getPostsAndAuthors( comments ) ).to.deep.equal( expectedResults.postsAndAuthors.page1 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.comments().get().then(function( posts ) {
				expect( posts ).to.have.property( '_paging' );
				expect( posts._paging ).to.be.an( 'object' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of posts', function() {
			var prom = wp.comments().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'total' );
				expect( posts._paging.total ).to.equal( '25' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.comments().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'totalPages' );
				expect( posts._paging.totalPages ).to.equal( '3' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.comments().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'next' );
				expect( posts._paging.next ).to.be.an( 'object' );
				expect( posts._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( posts._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/comments?page=2' );
				// Get last page & ensure 'next' no longer appears
				return wp.comments().page( posts._paging.totalPages ).get().then(function( posts ) {
					expect( posts._paging ).not.to.have.property( 'next' );
					expect( getPostsAndAuthors( posts ) ).to.deep.equal( expectedResults.postsAndAuthors.page3 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.comments().get().then(function( posts ) {
				return posts._paging.next.get().then(function( posts ) {
					expect( posts ).to.be.an( 'array' );
					expect( posts.length ).to.equal( 10 );
					expect( getPostsAndAuthors( posts ) ).to.deep.equal( expectedResults.postsAndAuthors.page2 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.comments().get().then(function( posts ) {
				expect( posts._paging ).not.to.have.property( 'prev' );
				return posts._paging.next.get().then(function( posts ) {
					expect( posts._paging ).to.have.property( 'prev' );
					expect( posts._paging.prev ).to.be.an( 'object' );
					expect( posts._paging.prev ).to.be.an.instanceOf( WPRequest );
					expect( posts._paging.prev._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/comments?page=1' );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.comments().page( 2 ).get().then(function( posts ) {
				expect( getPostsAndAuthors( posts ) ).to.deep.equal( expectedResults.postsAndAuthors.page2 );
				return posts._paging.prev.get().then(function( posts ) {
					expect( posts ).to.be.an( 'array' );
					expect( posts.length ).to.equal( 10 );
					expect( getPostsAndAuthors( posts ) ).to.deep.equal( expectedResults.postsAndAuthors.page1 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'querying by ID', function() {
		var commentCollection;
		var commentId;
		var commentProm;

		beforeEach(function() {
			commentCollection = [];
			commentProm = wp.comments().get().then(function( comments ) {
				commentCollection = comments;
				commentId = commentCollection[4].id;
				return wp.comments().id( commentId ).get();
			});
		});

		it( 'returns an object, not an array', function() {
			var prom = commentProm.then(function( comment ) {
				expect( Array.isArray( comment ) ).to.equal( false );
				expect( comment ).to.be.an( 'object' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'returns the correct comment', function() {
			var prom = commentProm.then(function( comment ) {
				expect( comment.id ).to.equal( commentId );
				[ 'author_name', 'post', 'parent', 'date', 'status' ].forEach(function( prop ) {
					expect( comment[ prop ] ).to.equal( commentCollection[4][ prop ] );
				});
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'forPost() query', function() {
		var pageComments;
		var commentProm;

		beforeEach(function() {
			var pageId = 155;
			commentProm = wp.pages().id( pageId ).embed().get().then(function( page ) {
				// Do a flatten reduction because .replies will be an array of arrays
				pageComments = page._embedded.replies.reduce(function( flatArr, arr ) {
					return flatArr.concat( arr );
				}, [] );
				return wp.comments().forPost( pageId ).get();
			});
		});

		it( 'returns an array of posts', function() {
			return expect( commentProm ).to.eventually.be.an( 'array' );
		});

		it( 'returns the correct number of comments', function() {
			var prom = commentProm.then(function( comments ) {
				expect( comments.length ).to.equal( 3 );
				expect( comments.length ).to.equal( pageComments.length );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'returns the correct comments', function() {
			var prom = commentProm.then(function( comments ) {
				pageComments.forEach(function( comment, i ) {
					[ 'id', 'parent', 'author', 'author_name' ].forEach(function( prop ) {
						expect( comment[ prop ] ).to.equal( comments[ i ][ prop ] );
					});
					expect( comment.content.rendered ).to.equal( comments[ i ].content.rendered );
				});
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

});
