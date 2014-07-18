'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../' );

// Other constructors, for use with instanceof checks
var MediaRequest = require( '../lib/media' );
var PagesRequest = require( '../lib/pages' );
var PostsRequest = require( '../lib/posts' );
var TaxonomiesRequest = require( '../lib/taxonomies' );
var TypesRequest = require( '../lib/types' );
var UsersRequest = require( '../lib/users' );
var CollectionRequest = require( '../lib/shared/collection-request' );
var WPRequest = require( '../lib/shared/wp-request' );

describe( 'wp', function() {

	var site;

	beforeEach(function() {
		site = new WP({ endpoint: 'endpoint/url' });
	});

	describe( 'constructor', function() {

		it( 'enforces new', function() {
			var wp1 = new WP({ endpoint: '/' });
			expect( wp1 instanceof WP ).to.be.true;
			var wp2 = WP({ endpoint: '/' });
			expect( wp2 instanceof WP ).to.be.true;
		});

		it( 'throws an error if no endpoint is provided', function() {
			expect(function() {
				new WP({ endpoint: '/' });
			}).not.to.throw();
			expect(function() {
				new WP();
			}).to.throw();
		});

		it( 'sets options on an instance variable', function() {
			var wp = new WP({
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky'
			});
			expect( wp._options.endpoint ).to.equal( 'http://some.url.com/wp-json/' );
			expect( wp._options.username ).to.equal( 'fyodor' );
			expect( wp._options.password ).to.equal( 'dostoyevsky' );
		});

	});

	describe( '.site()', function() {

		it( 'Creates and returns a new WP instance', function() {
			var site = WP.site( 'endpoint/url' );
			expect( site instanceof WP ).to.be.true;
			expect( site._options.endpoint ).to.equal( 'endpoint/url/' );
		});

	});

	describe( '.registerType()', function() {

		it( 'is defined', function() {
			expect( site ).to.have.property( 'registerType' );
			expect( site.registerType ).to.be.a( 'function' );
		});

		it( 'returns a function that creates new PostsRequest instances', function() {
			var requestMethod = site.registerType( 'some_cpt' );
			expect( requestMethod ).to.be.a( 'function' );
			var request = requestMethod();
			expect( request instanceof PostsRequest ).to.be.true;
		});

		it( 'binds the returned PostsRequest to the provided post type(s)', function() {
			var requestMethod = site.registerType( 'cpt_name' );
			var request = requestMethod();
			expect( request ).to.have.property( '_params' );
			expect( request._params ).to.have.property( 'type' );
			expect( request._params.type ).to.equal( 'cpt_name' );

			// Try with multiple post types
			var postsAndCPTs = site.registerType([ 'cpt1', 'cpt2', 'posts' ]);
			request = postsAndCPTs();
			expect( request._params.type ).to.deep.equal([ 'cpt1', 'cpt2', 'posts' ]);
		});

		it( 'inherits options from the parent WP instance', function() {
			var wp = new WP({
				endpoint: 'http://website.com',
				custom: 'option value'
			});
			var requestMethod = wp.registerType( 'cat_breeds' );
			var request = requestMethod();
			expect( request._options ).to.have.property( 'endpoint' );
			expect( request._options.endpoint ).to.equal( 'http://website.com/' );
			expect( request._options ).to.have.property( 'custom' );
			expect( request._options.custom ).to.equal( 'option value' );
		});

	});

	describe( '.url()', function() {

		it( 'is defined', function() {
			expect( site ).to.have.property( 'url' );
			expect( site.url ).to.be.a( 'function' );
		});

		it( 'creates a basic WPRequest object bound to the provided URL', function() {
			var request = site.url( 'http://some.arbitrary.url' );
			expect( request instanceof WPRequest ).to.be.true;
			expect( request._options.endpoint ).to.equal( 'http://some.arbitrary.url' );
		});

		it( 'maps requests directly onto the provided URL', function() {
			var request = site.url( 'http://some.url.com/wp-json?filter[name]=some-slug' );
			var path = request._renderURI();
			expect( path ).to.equal( 'http://some.url.com/wp-json?filter[name]=some-slug' );
		});

		it( 'inherits non-endpoint options from the parent WP instance', function() {
			var wp = new WP({
				endpoint: 'http://website.com/',
				identifier: 'some unique value'
			});
			var request = wp.url( 'http://new-endpoint.com/' );
			expect( request._options ).to.have.property( 'endpoint' );
			expect( request._options.endpoint ).to.equal( 'http://new-endpoint.com/' );
			expect( request._options ).to.have.property( 'identifier' );
			expect( request._options.identifier ).to.equal( 'some unique value' );
		});

	});

	describe( '.root()', function() {

		it( 'is defined', function() {
			expect( site ).to.have.property( 'root' );
			expect( site.root ).to.be.a( 'function' );
		});

		it( 'creates a get request against the root endpoint', function() {
			site._options.endpoint = 'http://my.site.com/wp-json/';
			var request = site.root();
			expect( request._renderURI() ).to.equal( 'http://my.site.com/wp-json/' );
		});

		it( 'takes a "path" property to query a root-relative path', function() {
			site._options.endpoint = 'http://my.site.com/wp-json/';
			var request = site.root( 'custom/endpoint' );
			expect( request._renderURI() ).to.equal( 'http://my.site.com/wp-json/custom/endpoint' );
		});

		it( 'creates a basic WPRequest if "collection" is unspecified or "false"', function() {
			var pathRequest = site.root( 'some/relative/root' );
			expect( pathRequest._template ).to.equal( 'some/relative/root' );
			expect( pathRequest instanceof WPRequest ).to.be.true;
			expect( pathRequest instanceof CollectionRequest ).to.be.false;
		});

		it( 'creates a CollectionRequest object if "collection" is "true"', function() {
			var pathRequest = site.root( 'some/collection/endpoint', true );
			expect( pathRequest._template ).to.equal( 'some/collection/endpoint' );
			expect( pathRequest instanceof WPRequest ).to.be.true;
			expect( pathRequest instanceof CollectionRequest ).to.be.true;
		});

		it( 'inherits options from the parent WP instance', function() {
			var wp = new WP({
				endpoint: 'http://cat.website.com/',
				customOption: 'best method ever'
			});
			var request = wp.root( 'custom-path' );
			expect( request._options ).to.have.property( 'endpoint' );
			expect( request._options.endpoint ).to.equal( 'http://cat.website.com/' );
			expect( request._options ).to.have.property( 'customOption' );
			expect( request._options.customOption ).to.equal( 'best method ever' );
		});

	});

	describe( 'endpoint accessors', function() {

		it( 'defines a media endpoint handler', function() {
			var media = site.media();
			expect( media instanceof MediaRequest ).to.be.true;
		});

		it( 'defines a pages endpoint handler', function() {
			var posts = site.pages();
			expect( posts instanceof PagesRequest ).to.be.true;
		});

		it( 'defines a posts endpoint handler', function() {
			var posts = site.posts();
			expect( posts instanceof PostsRequest ).to.be.true;
		});

		it( 'defines a taxonomies endpoint handler', function() {
			var posts = site.taxonomies();
			expect( posts instanceof TaxonomiesRequest ).to.be.true;
		});

		it( 'defines a types endpoint handler', function() {
			var posts = site.types();
			expect( posts instanceof TypesRequest ).to.be.true;
		});

		it( 'defines a users endpoint handler', function() {
			var posts = site.users();
			expect( posts instanceof UsersRequest ).to.be.true;
		});

	});

	describe( 'taxonomy shortcut handlers', function() {

		it( 'defines a .categories() shortcut for the category taxonomy terms', function() {
			var categories = site.categories();
			expect( categories instanceof TaxonomiesRequest ).to.be.true;
			expect( categories._renderURI() ).to.equal( 'endpoint/url/taxonomies/category/terms' );
		});

		it( 'defines a .tags() shortcut for the tag taxonomy terms', function() {
			var tags = site.tags();
			expect( tags instanceof TaxonomiesRequest ).to.be.true;
			expect( tags._renderURI() ).to.equal( 'endpoint/url/taxonomies/post_tag/terms' );
		});

		it( 'defines a generic .taxonomy() handler for arbitrary taxonomy objects', function() {
			var taxRequest = site.taxonomy( 'my_custom_tax' );
			expect( taxRequest instanceof TaxonomiesRequest ).to.be.true;
			var uri = taxRequest._renderURI();
			expect( uri ).to.equal( 'endpoint/url/taxonomies/my_custom_tax' );
		});

	});

});
