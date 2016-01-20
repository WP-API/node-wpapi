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
var WPRequest = require( '../../lib/shared/wp-request.js' );

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the names from categories on the first page)
var expectedResults = {
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
			'Cat C'
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
			'clerkship'
		],
		pageLast: [
			'ween',
			'wellhead',
			'wellintentioned',
			'whetstone',
			'years'
		]
	}
};

// Inspecting the titles of the returned categories arrays is an easy way to
// validate that the right page of results was returned
function getNames( categories ) {
	return categories.map(function( category ) {
		return category.name;
	});
}

describe( 'integration: categories()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a collection of category terms', function() {
		var prom = wp.categories().get().then(function( categories ) {
			expect( categories ).to.be.an( 'array' );
			expect( categories.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'retrieves the first 10 categories by default', function() {
		var prom = wp.categories().get().then(function( categories ) {
			expect( categories ).to.be.an( 'array' );
			expect( categories.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.categories().get().then(function( categories ) {
				expect( categories ).to.have.property( '_paging' );
				expect( categories._paging ).to.be.an( 'object' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of categories', function() {
			var prom = wp.categories().get().then(function( categories ) {
				expect( categories._paging ).to.have.property( 'total' );
				expect( categories._paging.total ).to.equal( '65' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.categories().get().then(function( categories ) {
				expect( categories._paging ).to.have.property( 'totalPages' );
				expect( categories._paging.totalPages ).to.equal( '7' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.categories().get().then(function( categories ) {
				expect( categories._paging ).to.have.property( 'next' );
				expect( categories._paging.next ).to.be.an( 'object' );
				expect( categories._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( categories._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/categories?page=2' );
				// Get last page & ensure "next" no longer appears
				return wp.categories().page( categories._paging.totalPages ).get().then(function( categories ) {
					expect( categories._paging ).not.to.have.property( 'next' );
					expect( getNames( categories ) ).to.deep.equal( expectedResults.names.pageLast );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.categories().get().then(function( categories ) {
				return categories._paging.next.get().then(function( categories ) {
					expect( categories ).to.be.an( 'array' );
					expect( categories.length ).to.equal( 10 );
					expect( getNames( categories ) ).to.deep.equal( expectedResults.names.page2 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.categories().get().then(function( categories ) {
				expect( categories._paging ).not.to.have.property( 'prev' );
				return categories._paging.next.get().then(function( categories ) {
					expect( categories._paging ).to.have.property( 'prev' );
					expect( categories._paging.prev ).to.be.an( 'object' );
					expect( categories._paging.prev ).to.be.an.instanceOf( WPRequest );
					expect( categories._paging.prev._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/categories?page=1' );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.categories().page( 2 ).get().then(function( categories ) {
				expect( getNames( categories ) ).to.deep.equal( expectedResults.names.page2 );
				return categories._paging.prev.get().then(function( categories ) {
					expect( categories ).to.be.an( 'array' );
					expect( categories.length ).to.equal( 10 );
					expect( getNames( categories ) ).to.deep.equal( expectedResults.names.page1 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

});
