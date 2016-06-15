'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;
var _ = require( 'lodash' );

var WP = require( '../../' );
var WPRequest = require( '../../lib/constructors/wp-request.js' );

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

	describe( 'id()', function() {

		it( 'can be used to access an individual category term', function() {
			var selectedCategory;
			var prom = wp.categories().get().then(function( categories ) {
				// Pick one of the categories
				selectedCategory = categories[ 3 ];
				// Query for that category directly
				return wp.categories().id( selectedCategory.id );
			}).then(function( category ) {
				expect( category ).to.be.an( 'object' );
				expect( category ).to.have.property( 'id' );
				expect( category.id ).to.equal( selectedCategory.id );
				expect( category ).to.have.property( 'slug' );
				expect( category.slug ).to.equal( selectedCategory.slug );
				expect( category ).to.have.property( 'taxonomy' );
				expect( category.taxonomy ).to.equal( 'category' );
				expect( category ).to.have.property( 'parent' );
				expect( category.parent ).to.equal( 0 );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'search()', function() {

		it( 'can be used to retrieve a category by slug', function() {
			var selectedCategory;
			var prom = wp.categories().get().then(function( categories ) {
				// Pick one of the categories
				selectedCategory = categories[ 3 ];
				// Search for that category by slug
				return wp.categories().search( selectedCategory.slug );
			}).then(function( categories ) {
				expect( categories ).to.be.an( 'array' );
				expect( categories.length ).to.equal( 1 );
				return categories[ 0 ];
			}).then(function( category ) {
				expect( category ).to.be.an( 'object' );
				expect( category ).to.have.property( 'id' );
				expect( category.id ).to.equal( selectedCategory.id );
				expect( category ).to.have.property( 'slug' );
				expect( category.slug ).to.equal( selectedCategory.slug );
				expect( category ).to.have.property( 'taxonomy' );
				expect( category.taxonomy ).to.equal( 'category' );
				expect( category ).to.have.property( 'parent' );
				expect( category.parent ).to.equal( 0 );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'returns all categories matching the provided search string', function() {
			var prom = wp.categories().search( 'parent' ).get().then(function( categories ) {
				expect( categories ).to.be.an( 'array' );
				expect( categories.length ).to.equal( 4 );
				var slugs = categories.map(function( cat ) {
					return cat.slug;
				}).sort().join( ' ' );
				expect( slugs ).to.equal( 'foo-a-foo-parent foo-parent parent parent-category' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'can be used to retrieve a category by slug from a set of search results', function() {
			var prom = wp.categories().search( 'parent' ).get().then(function( categories ) {
				// Iterating over response of search is the best we can do until
				// filtering for taxonomy term collections is reinstated
				for ( var i = 0; i < 4; i++ ) {
					if ( categories[ i ].slug === 'parent' ) {
						return categories[ i ];
					}
				}
			}).then(function( category ) {
				expect( category ).to.have.property( 'slug' );
				expect( category.slug ).to.equal( 'parent' );
				expect( category ).to.have.property( 'name' );
				expect( category.name ).to.equal( 'Parent' );
				expect( category ).to.have.property( 'parent' );
				expect( category.parent ).to.equal( 0 );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'parent()', function() {

		it( 'can be used to retrieve direct children of a specific category', function() {
			var parentCat;
			var childCat1;
			var childCat2;
			// First, find the "parent" category
			var prom = wp.categories().search( 'parent' ).get().then(function( categories ) {
				for ( var i = 0; i < 4; i++ ) {
					if ( categories[ i ].slug === 'parent' ) {
						// Return a query for the matching category's child
						parentCat = categories[ i ];
						return wp.categories().parent( parentCat.id );
					}
				}
			}).then(function( categories ) {
				expect( categories ).to.be.an( 'array' );
				expect( categories.length ).to.equal( 1 );
				var category = categories[ 0 ];
				expect( category ).to.have.property( 'name' );
				expect( category.name ).to.equal( 'Child 1' );
				expect( category ).to.have.property( 'parent' );
				expect( category.parent ).to.equal( parentCat.id );
				childCat1 = category;
				// Go one level deeper
				return wp.categories().parent( childCat1.id );
			}).then(function( categories ) {
				expect( categories ).to.be.an( 'array' );
				expect( categories.length ).to.equal( 1 );
				var category = categories[ 0 ];
				expect( category ).to.have.property( 'name' );
				expect( category.name ).to.equal( 'Child 2' );
				expect( category ).to.have.property( 'parent' );
				expect( category.parent ).to.equal( childCat1.id );
				childCat2 = category;
				// Go one level deeper
				return wp.categories().parent( childCat2.id );
			}).then(function( categories ) {
				expect( categories ).to.be.an( 'array' );
				expect( categories.length ).to.equal( 0 );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( 'forPost()', function() {

		it( 'can be used to retrieve terms for a specific post', function() {
			var postCategories;
			var prom = wp.posts().perPage( 1 ).embed().get().then(function( posts ) {
				var post = posts[ 0 ];
				// Find the categories for this post
				postCategories = _.findWhere( post._embedded['wp:term'], function( terms ) {
					if ( terms.length && terms[ 0 ].taxonomy === 'category' ) {
						return true;
					}
				});
				var postId = post.id;
				return wp.categories().forPost( postId );
			}).then(function( categories ) {
				expect( categories.length ).to.equal( postCategories.length );
				categories.forEach(function( cat, idx ) {
					[
						'id',
						'name',
						'slug',
						'taxonomy'
					].forEach(function( prop ) {
						expect( cat[ prop ] ).to.equal( postCategories[ idx ][ prop ] );
					});
				});
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

});
