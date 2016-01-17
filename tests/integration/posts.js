'use strict';
var chai = require( 'chai' );
// Chai-as-promised and the `expect( prom ).to.eventually.equal( 'success' ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WP = require( '../../' );
var WPRequest = require( '../../lib/shared/wp-request.js' );

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from posts on the first page)
var expectedResults = {
	titles: {
		page1: [
			'Markup: HTML Tags and Formatting',
			'Markup: Image Alignment',
			'Markup: Text Alignment',
			'Markup: Title With Special Characters',
			'Markup: Title With Markup',
			'Template: Featured Image (Vertical)',
			'Template: Featured Image (Horizontal)',
			'Template: More Tag',
			'Template: Excerpt (Defined)',
			'Template: Excerpt (Generated)'
		],
		page2: [
			'Template: Paginated',
			'Template: Sticky',
			'Template: Comments',
			'Template: Comments Disabled',
			'Template: Pingbacks And Trackbacks',
			'Media: Twitter Embeds',
			'Post Format: Standard',
			'Post Format: Gallery',
			'Post Format: Gallery (Tiled)'
		],
		page4: [
			'Post Format: Quote',
			'Post Format: Chat',
			'Antidisestablishmentarianism',
			'',
			'Edge Case: No Content',
			'Edge Case: Many Categories',
			'Edge Case: Many Tags',
			'Edge Case: Nested And Mixed Lists'
		]
	}
};

// Inspecting the titles of the returned posts arrays is an easy way to
// validate that the right page of results was returned
function getTitles( posts ) {
	return posts.map(function( post ) {
		return post.title.rendered;
	});
}

describe( 'integration: posts()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a list of recent posts', function() {
		var prom = wp.posts().get().then(function( posts ) {
			expect( posts ).to.be.an( 'array' );
			expect( posts.length ).to.equal( 10 );
			return 'success';
		});
		return expect( prom ).to.eventually.equal( 'success' );
	});

	it( 'fetches the 10 most recent posts by default', function() {
		var prom = wp.posts().get().then(function( posts ) {
			expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
			return 'success';
		});
		return expect( prom ).to.eventually.equal( 'success' );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.posts().get().then(function( posts ) {
				expect( posts ).to.have.property( '_paging' );
				expect( posts._paging ).to.be.an( 'object' );
				return 'success';
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'include the total number of posts', function() {
			var prom = wp.posts().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'total' );
				expect( posts._paging.total ).to.equal( '38' );
				return 'success';
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.posts().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'totalPages' );
				expect( posts._paging.totalPages ).to.equal( '4' );
				return 'success';
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.posts().get().then(function( posts ) {
				expect( posts._paging ).to.have.property( 'next' );
				expect( posts._paging.next ).to.be.an( 'object' );
				expect( posts._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( posts._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=2' );
				// Get last page & ensure "next" no longer appears
				return wp.posts().page( posts._paging.totalPages ).get().then(function( posts ) {
					expect( posts._paging ).not.to.have.property( 'next' );
					expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page4 );
					return 'success';
				});
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.posts().get().then(function( posts ) {
				return posts._paging.next.get().then(function( posts ) {
					expect( posts ).to.be.an( 'array' );
					expect( posts.length ).to.equal( 9 );
					expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
					return 'success';
				});
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.posts().get().then(function( posts ) {
				expect( posts._paging ).not.to.have.property( 'prev' );
				return posts._paging.next.get().then(function( posts ) {
					expect( posts._paging ).to.have.property( 'prev' );
					expect( posts._paging.prev ).to.be.an( 'object' );
					expect( posts._paging.prev ).to.be.an.instanceOf( WPRequest );
					expect( posts._paging.prev._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/posts?page=1' );
					return 'success';
				});
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.posts().page( 2 ).get().then(function( posts ) {
				expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page2 );
				return posts._paging.prev.get().then(function( posts ) {
					expect( posts ).to.be.an( 'array' );
					expect( posts.length ).to.equal( 10 );
					expect( getTitles( posts ) ).to.deep.equal( expectedResults.titles.page1 );
					return 'success';
				});
			});
			return expect( prom ).to.eventually.equal( 'success' );
		});

	});

	describe( 'filter methods', function() {

		describe( 'tag', function() {

			it( 'can be used to return only posts with a provided tag', function() {
				var prom = wp.posts().tag( 'Title' ).get().then(function( posts ) {
					expect( posts.length ).to.equal( 5 );
					expect( getTitles( posts ) ).to.deep.equal([
						'Markup: Title With Special Characters',
						'Markup: Title With Markup',
						'Antidisestablishmentarianism',
						'',
						'Edge Case: Many Tags'
					]);
					return 'success';
				});
				return expect( prom ).to.eventually.equal( 'success' );
			});

			it( 'can be used to return only posts with all provided tags', function() {
				var prom = wp.posts().tag([
					'Template',
					'Codex'
				]).get().then(function( posts ) {
					expect( posts.length ).to.equal( 3 );
					expect( getTitles( posts ) ).to.deep.equal([
						'Template: Featured Image (Vertical)',
						'Template: Featured Image (Horizontal)',
						'Edge Case: Many Tags'
					]);
					return 'success';
				});
				return expect( prom ).to.eventually.equal( 'success' );
			});

		});

		describe( 'category', function() {

			it( 'can be used to return only posts with a provided category', function() {
				var prom = wp.posts().category( 'Markup' ).get().then(function( posts ) {
					expect( posts.length ).to.equal( 6 );
					expect( getTitles( posts ) ).to.deep.equal([
						'Markup: HTML Tags and Formatting',
						'Markup: Image Alignment',
						'Markup: Text Alignment',
						'Markup: Title With Special Characters',
						'Markup: Title With Markup',
						'Edge Case: Many Categories'
					]);
					return 'success';
				});
				return expect( prom ).to.eventually.equal( 'success' );
			});

			// Pending until we confirm whether querying by multiple category_name is permitted
			it( 'can be used to return only posts with all provided categories', function() {
				var prom = wp.posts().category([
					'Markup',
					'pustule'
				]).get().then(function( posts ) {
					expect( posts.length ).to.equal( 1 );
					expect( getTitles( posts ) ).to.deep.equal([
						'Edge Case: Many Categories'
					]);
					return 'success';
				});
				return expect( prom ).to.eventually.equal( 'success' );
			});

		});

	});

});
