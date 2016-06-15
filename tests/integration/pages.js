'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WP = require( '../../' );
var WPRequest = require( '../../lib/constructors/wp-request.js' );

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the titles from pages on the first page)
var expectedResults = {
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
			'Front Page'
		],
		page2: [
			'Clearing Floats',
			'About The Tests',
			'Level 1',
			'Level 2',
			'Level 3',
			'Page with comments disabled',
			'Page with comments',
			'Lorem Ipsum'
		]
	}
};

// Inspecting the titles of the returned pages arrays is an easy way to
// validate that the right page of results was returned
function getTitles( pages ) {
	return pages.map(function( post ) {
		return post.title.rendered;
	});
}

describe( 'integration: pages()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a list of recent pages', function() {
		var prom = wp.pages().get().then(function( pages ) {
			expect( pages ).to.be.an( 'array' );
			expect( pages.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'fetches the 10 most recent pages by default', function() {
		var prom = wp.pages().get().then(function( pages ) {
			expect( getTitles( pages ) ).to.deep.equal( expectedResults.titles.page1 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.pages().get().then(function( pages ) {
				expect( pages ).to.have.property( '_paging' );
				expect( pages._paging ).to.be.an( 'object' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages', function() {
			var prom = wp.pages().get().then(function( pages ) {
				expect( pages._paging ).to.have.property( 'total' );
				expect( pages._paging.total ).to.equal( '18' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.pages().get().then(function( pages ) {
				expect( pages._paging ).to.have.property( 'totalPages' );
				expect( pages._paging.totalPages ).to.equal( '2' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.pages().get().then(function( pages ) {
				expect( pages._paging ).to.have.property( 'next' );
				expect( pages._paging.next ).to.be.an( 'object' );
				expect( pages._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( pages._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/pages?page=2' );
				// Get last page & ensure "next" no longer appears
				return wp.pages().page( pages._paging.totalPages ).get().then(function( pages ) {
					expect( pages._paging ).not.to.have.property( 'next' );
					expect( getTitles( pages ) ).to.deep.equal( expectedResults.titles.page2 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.pages().get().then(function( pages ) {
				return pages._paging.next.get().then(function( pages ) {
					expect( pages ).to.be.an( 'array' );
					expect( pages.length ).to.equal( 8 );
					expect( getTitles( pages ) ).to.deep.equal( expectedResults.titles.page2 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.pages().get().then(function( pages ) {
				expect( pages._paging ).not.to.have.property( 'prev' );
				return pages._paging.next.get().then(function( pages ) {
					expect( pages._paging ).to.have.property( 'prev' );
					expect( pages._paging.prev ).to.be.an( 'object' );
					expect( pages._paging.prev ).to.be.an.instanceOf( WPRequest );
					expect( pages._paging.prev._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/pages?page=1' );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.pages().page( 2 ).get().then(function( pages ) {
				expect( getTitles( pages ) ).to.deep.equal( expectedResults.titles.page2 );
				return pages._paging.prev.get().then(function( pages ) {
					expect( pages ).to.be.an( 'array' );
					expect( pages.length ).to.equal( 10 );
					expect( getTitles( pages ) ).to.deep.equal( expectedResults.titles.page1 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'filter methods', function() {

		describe( 'slug', function() {

			it( 'can be used to return only pages with the specified slug', function() {
				var prom = wp.pages().slug( 'clearing-floats' ).get().then(function( pages ) {
					expect( pages.length ).to.equal( 1 );
					expect( getTitles( pages ) ).to.deep.equal([
						'Clearing Floats'
					]);
					return SUCCESS;
				});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

		describe( 'path', function() {

			it( 'can be used to return only pages with the specified URL path', function() {
				var prom = wp.pages().path( 'level-1/level-2/level-3a' ).get().then(function( pages ) {
					expect( pages.length ).to.equal( 1 );
					expect( getTitles( pages ) ).to.deep.equal([
						'Level 3a'
					]);
					return SUCCESS;
				});
				return expect( prom ).to.eventually.equal( SUCCESS );
			});

		});

	});

});
