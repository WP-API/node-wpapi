/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );
// const sandbox = require( 'sandboxed-module' );

const extend = require( 'node.extend' );
const filters = require( '../../../lib/shared/filters' );

describe( 'CollectionFilters', function() {

	var request;

	beforeEach(function() {
		function Endpoint() {
			this._filters = {};
			this._taxonomyFilters = {};
		}
		extend( Endpoint.prototype, filters.mixins );
		request = new Endpoint();
	});

	describe( 'filter()', function() {

		it( 'should set the internal _filters hash', function() {
			request.filter({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
		});

		it( 'should support passing a single filter property as key & value arguments', function() {
			request.filter( 'postType', 'page' );
			expect( request._filters ).to.deep.equal({
				postType: 'page'
			});
		});

		it( 'should support redefining filter values', function() {
			request.filter( 'postStatus', 'draft' );
			request.filter( 'postStatus', 'publish' );
			expect( request._filters.postStatus ).to.equal( 'publish' );
		});

		it( 'should support chaining filters', function() {
			request.filter({
				someFilterProp: 'filter-value'
			}).filter({
				postsPerPage: 7
			}).filter( 'postStatus', 'draft' );
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7,
				postStatus: 'draft'
			});
		});

	});

	describe( 'filtering convenience methods', function() {

		beforeEach(function() {
			request._taxonomyFilters = {};
			request._filters = {};
		});

		describe( 'taxonomy()', function() {

			it( 'should throw if an invalid term argument is provided', function() {
				expect(function() {
					request.taxonomy( 'tag', 'slug' );
				}).not.to.throw();

				expect(function() {
					request.taxonomy( 'cat', 7 );
				}).not.to.throw();

				expect(function() {
					request.taxonomy( 'category_name', [ 'slug1', 'slug2' ] );
				}).not.to.throw();

				expect(function() {
					request.taxonomy( 'tag', {} );
				}).to.throw();
			});

			it( 'should store taxonomy terms in a sorted array, keyed by taxonomy', function() {
				request.taxonomy( 'some_tax', 'nigel' );
				request.taxonomy( 'some_tax', [ 'tufnel', 'derek', 'smalls' ] );
				expect( request._taxonomyFilters ).to.deep.equal({
					some_tax: [ 'derek', 'nigel', 'smalls', 'tufnel' ]
				});
				request
					.taxonomy( 'drummers', [ 'stumpy', 'mama' ] )
					.taxonomy( 'drummers', [ 'stumpy-joe', 'james' ] )
					.taxonomy( 'drummers', 'ric' );
				expect( request._taxonomyFilters ).to.deep.equal({
					some_tax: [ 'derek', 'nigel', 'smalls', 'tufnel' ],
					drummers: [ 'james', 'mama', 'ric', 'stumpy', 'stumpy-joe' ]
				});
			});

			it( 'should handle numeric terms, for category and taxonomy ID', function() {
				request.taxonomy( 'age', [ 42, 2001, 13 ] );
				expect( request._taxonomyFilters ).to.deep.equal({
					age: [ 13, 42, 2001 ]
				});
			});

			it( 'should map "category" to "cat" for numeric terms', function() {
				request.taxonomy( 'category', 7 );
				expect( request._taxonomyFilters ).to.deep.equal({
					cat: [ 7 ]
				});
				request.taxonomy( 'category', [ 10, 2 ] );
				expect( request._taxonomyFilters ).to.deep.equal({
					cat: [ 2, 7, 10 ]
				});
			});

			it( 'should map "category" to "category_name" for string terms', function() {
				request.taxonomy( 'category', 'news' );
				expect( request._taxonomyFilters ).to.deep.equal({
					category_name: [ 'news' ]
				});
				request.taxonomy( 'category', [ 'events', 'fluxus-happenings' ] );
				expect( request._taxonomyFilters ).to.deep.equal({
					category_name: [ 'events', 'fluxus-happenings', 'news' ]
				});
			});

			it( 'should map "post_tag" to "tag" for tag terms', function() {
				request.taxonomy( 'post_tag', 'disclosure' );
				expect( request._taxonomyFilters ).to.deep.equal({
					tag: [ 'disclosure' ]
				});
				request.taxonomy( 'post_tag', [ 'white-noise', 'settle' ] );
				expect( request._taxonomyFilters ).to.deep.equal({
					tag: [ 'disclosure', 'settle', 'white-noise' ]
				});
			});

		});

		describe( 'category()', function() {

			it( 'delegates to taxonomy()', function() {
				request.taxonomy = sinon.stub();
				request.category( 'news' );
				expect( request.taxonomy ).to.have.been.calledWith( 'category', 'news' );
				request.category( 'bat-country' ).category( 'bunny' )
			});

		});

		describe( 'tag()', function() {

			it( 'delegates to taxonomy()', function() {
				request.taxonomy = sinon.stub();
				request.tag( 'the-good-life' );
				expect( request.taxonomy ).to.have.been.calledWith( 'tag', 'the-good-life' );
			});

		});

	});

	describe( '_queryStr()', function() {

		it( 'properly parses taxonomy filters', function() {
			request._taxonomyFilters = {
				tag: [ 'clouds ', 'islands' ],
				custom_tax: [ 7 ]
			};
			var query = request._queryStr();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to
				.equal( '?filter%5Bcustom_tax%5D=7&filter%5Btag%5D=clouds%2Bislands' );
		});

		it( 'lower-cases taxonomy terms', function() {
			request._taxonomyFilters = {
				tag: [ 'Diamond-Dust' ]
			};
			var query = request._queryStr();
			expect( query ).to.equal( '?filter%5Btag%5D=diamond-dust' );
		});

		it( 'properly parses regular filters', function() {
			request._filters = {
				post_status: 'publish', s: 'Some search string'
			};
			var query = request._queryStr();
			expect( query ).to
				.equal( '?filter%5Bpost_status%5D=publish&filter%5Bs%5D=Some%20search%20string' );
		});

		it( 'correctly merges taxonomy and regular filters & renders them in order', function() {
			request._taxonomyFilters = {
				cat: [ 7, 10 ]
			};
			request._filters = {
				name: 'some-slug'
			};
			var query = request._queryStr();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to.equal( '?filter%5Bcat%5D=7%2B10&filter%5Bname%5D=some-slug' );
		});

	});

});
