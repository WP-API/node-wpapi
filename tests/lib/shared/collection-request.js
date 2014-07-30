'use strict';
/*jshint -W106 */// Disable underscore_case warnings in this file b/c WP uses them
var chai = require( 'chai' );
var expect = chai.expect;
var sinon = require( 'sinon' );
chai.use( require( 'sinon-chai' ) );

var CollectionRequest = require( '../../../lib/shared/collection-request' );
var WPRequest = require( '../../../lib/shared/wp-request' );

describe( 'CollectionRequest', function() {

	var request;

	beforeEach(function() {
		request = new CollectionRequest();
		request._options.endpoint = '/';
	});

	describe( 'constructor', function() {

		it( 'should create a CollectionRequest instance', function() {
			expect( request instanceof CollectionRequest ).to.be.true;
		});

		it( 'should inherit from WPRequest', function() {
			expect( request instanceof WPRequest ).to.be.true;
		});

		it( 'should intitialize instance properties', function() {
			var _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
			expect( request._filters ).to.deep.equal( {} );
			expect( request._taxonomyFilters ).to.deep.equal( {} );
			expect( request._params ).to.deep.equal( {} );
			expect( request._path ).to.deep.equal( {} );
			expect( request._template ).to.equal( '' );
		});

		it( 'initializes requests with a _params dictionary', function() {
			expect( request ).to.have.property( '_params' );
			expect( request._params ).to.deep.equal( {} );
		});

	});

	describe( 'param()', function() {

		it( 'method exists', function() {
			expect( request ).to.have.property( 'param' );
			expect( request.param ).to.be.a( 'function' );
		});

		it( 'will set a query parameter value', function() {
			request.param( 'key', 'value' );
			expect( request._params ).to.have.property( 'key' );
			expect( request._params.key ).to.equal( 'value' );
		});

		it( 'should set the internal _params hash', function() {
			request.param( 'type', 'some_cpt' );
			expect( request._params ).to.have.property( 'type' );
			expect( request._params.type ).to.equal( 'some_cpt' );
			request.param( 'context', 'edit' );
			expect( request._params ).to.have.property( 'context' );
			expect( request._params.context ).to.equal( 'edit' );
		});

		it( 'should set parameters by passing a hash object', function() {
			request.param({
				page: 309,
				context: 'view'
			});
			expect( request._params ).to.have.property( 'page' );
			expect( request._params.page ).to.equal( 309 );
			expect( request._params ).to.have.property( 'context' );
			expect( request._params.context ).to.equal( 'view' );
		});

		it( 'should merge provided values if merge is set to true', function() {
			request.param( 'type', 'post' );
			request.param( 'type', 'page', true );
			expect( request._params.type ).to.deep.equal( [ 'page', 'post' ] );
		});

		it( 'should merge, de-dupe & sort array values', function() {
			request.param( 'type', [ 'post', 'page', 'post' ] );
			expect( request._params.type ).to.deep.equal( [ 'page', 'post' ] );
			request.param( 'type', [ 'page', 'cpt_item' ], true );
			expect( request._params.type ).to.deep.equal( [ 'cpt_item', 'page', 'post' ] );
		});

	});

	describe( 'parameter convenience methods', function() {

		describe( 'page', function() {

			it( 'should be defined', function() {
				expect( request ).to.have.property( 'page' );
				expect( request.page ).to.be.a( 'function' );
			});

			it( 'wraps .param()', function() {
				sinon.stub( request, 'param' );
				request.page( 9 );
				expect( request.param ).to.have.been.calledWith( 'page', 9 );
			});

			it( 'should set the "page" parameter', function() {
				request.page( 2 );
				expect( request._params ).to.have.property( 'page' );
				expect( request._params.page ).to.equal( 2 );
			});

			it( 'should map to the "page=N" query parameter', function() {
				var path = request.page( 71 )._renderURI();
				expect( path ).to.equal( '/?page=71' );
			});

			it( 'should replace values when called multiple times', function() {
				var path = request.page( 71 ).page( 2 )._renderURI();
				expect( path ).to.equal( '/?page=2' );
			});

		});

		describe( 'context', function() {

			it( 'should be defined', function() {
				expect( request ).to.have.property( 'context' );
				expect( request.context ).to.be.a( 'function' );
			});

			it( 'wraps .param()', function() {
				sinon.stub( request, 'param' );
				request.context( 'view' );
				expect( request.param ).to.have.been.calledWith( 'context', 'view' );
			});

			it( 'should set the "context" parameter', function() {
				request.context( 'edit' );
				expect( request._params ).to.have.property( 'context' );
				expect( request._params.context ).to.equal( 'edit' );
			});

			it( 'should map to the "context=VALUE" query parameter', function() {
				var path = request.context( 'edit' )._renderURI();
				expect( path ).to.equal( '/?context=edit' );
			});

			it( 'should replace values when called multiple times', function() {
				var path = request.context( 'edit' ).context( 'view' )._renderURI();
				expect( path ).to.equal( '/?context=view' );
			});

			it( 'should provide a .edit() shortcut for .context( "edit" )', function() {
				sinon.spy( request, 'context' );
				request.edit();
				expect( request.context ).to.have.been.calledWith( 'edit' );
				expect( request._renderURI() ).to.equal( '/?context=edit' );
			});

			it( 'should force authentication when called with "edit"', function() {
				request.edit();
				expect( request._options ).to.have.property( 'auth' );
				expect( request._options.auth ).to.be.true;
			});

		});

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
				sinon.stub( request, 'taxonomy' );
				request.category( 'news' );
				expect( request.taxonomy ).to.have.been.calledWith( 'category', 'news' );
				request.taxonomy.restore();
			});

			it( 'should be chainable, and accumulates values', function() {
				expect( request.category( 'bat-country' ).category( 'bunny' ) ).to.equal( request );
				expect( request._taxonomyFilters ).to.deep.equal({
					category_name: [ 'bat-country', 'bunny' ]
				});
			});

		});

		describe( 'tag()', function() {

			it( 'delegates to taxonomy()', function() {
				sinon.stub( request, 'taxonomy' );
				request.tag( 'the-good-life' );
				expect( request.taxonomy ).to.have.been.calledWith( 'tag', 'the-good-life' );
				request.taxonomy.restore();
			});

			it( 'should be chainable, and accumulates values', function() {
				expect( request.tag( 'drive-by' ).tag( 'jackson-pollock' ) ).to.equal( request );
				expect( request._taxonomyFilters ).to.deep.equal({
					tag: [ 'drive-by', 'jackson-pollock' ]
				});
			});

		});

		describe( 'search()', function() {

			it( 'should set the "s" filter property on the request object', function() {
				request.search( 'Some search string' );
				expect( request._filters.s ).to.equal( 'Some search string' );
			});

			it( 'should be chainable, and replace values', function() {
				expect( request.search( 'str1' ).search( 'str2' ) ).to.equal( request );
				expect( request._filters.s ).to.equal( 'str2' );
			});

		});

		describe( 'author()', function() {

			it( 'should set the "author" filter property for numeric arguments', function() {
				request.author( 301 );
				expect( request._filters.author ).to.equal( 301 );
				expect( request._filters.author_name ).not.to.exist;
			});

			it( 'should set the "author_name" filter property for string arguments', function() {
				request.author( 'jamesagarfield' );
				expect( request._filters.author_name ).to.equal( 'jamesagarfield' );
				expect( request._filters.author ).not.to.exist;
			});

			it( 'should throw an error if arguments are neither string nor number', function() {
				expect(function() {
					request.author({ some: 'object' });
				}).to.throw();
			});

			it( 'should be chainable, and replace values', function() {
				expect( request.author( 'fforde' ).author( 'bronte' ) ).to.equal( request );
				expect( request._filters.author_name ).to.equal( 'bronte' );

				request.author( 1847 );
				expect( request._filters.author_name ).not.to.exist;
				expect( request._filters.author ).to.equal( 1847 );
			});

		});

		describe( 'name()', function() {

			it( 'should set the "name" filter property on the request object', function() {
				request.name( 'greatest-post-in-the-world' );
				expect( request._filters.name ).to.equal( 'greatest-post-in-the-world' );
			});

			it( 'should be chainable, and replace values', function() {
				expect( request.name( 'post-slug-1' ).name( 'hello-world' ) ).to.equal( request );
				expect( request._filters.name ).to.equal( 'hello-world' );
			});

		});

		describe( 'slug()', function() {

			it( 'should be an alias for name()', function() {
				expect( request.slug ).to.equal( request.name );
			});

			it( 'should set the "name" filter property on the request object', function() {
				request.slug( 'greatest-post-in-the-world' );
				expect( request._filters.name ).to.equal( 'greatest-post-in-the-world' );
			});

			it( 'should be chainable, and replace values', function() {
				expect( request.slug( 'post-slug-1' ).slug( 'hello-world' ) ).to.equal( request );
				expect( request._filters.name ).to.equal( 'hello-world' );
			});

		});

	});

	describe( '_renderQuery()', function() {

		it( 'properly parses taxonomy filters', function() {
			request._taxonomyFilters = {
				tag: [ 'clouds ', 'islands' ],
				custom_tax: [ 7 ]
			};
			var query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to
				.equal( '?filter%5Bcustom_tax%5D=7&filter%5Btag%5D=clouds%2Bislands' );
		});

		it( 'lower-cases taxonomy terms', function() {
			request._taxonomyFilters = {
				tag: [ 'Diamond-Dust' ]
			};
			var query = request._renderQuery();
			expect( query ).to.equal( '?filter%5Btag%5D=diamond-dust' );
		});

		it( 'properly parses regular filters', function() {
			request._filters = {
				post_status: 'publish', s: 'Some search string'
			};
			var query = request._renderQuery();
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
			var query = request._renderQuery();
			// Filters should be in alpha order, to support caching requests
			expect( query ).to.equal( '?filter%5Bcat%5D=7%2B10&filter%5Bname%5D=some-slug' );
		});

	});

});
