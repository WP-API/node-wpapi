'use strict';
var expect = require( 'chai' ).expect;

var WP = require( '../../' );

// Constructors, for use with instanceof checks
var WPRequest = require( '../../lib/constructors/wp-request' );

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

		beforeEach(function() {
			site = new WP({ endpoint: 'http://my.site.com/wp-json' });
		});

		it( 'is defined', function() {
			expect( site ).to.have.property( 'root' );
			expect( site.root ).to.be.a( 'function' );
		});

		it( 'creates a get request against the root endpoint', function() {
			var request = site.root();
			expect( request._renderURI() ).to.equal( 'http://my.site.com/wp-json/' );
		});

		it( 'takes a "path" argument to query a root-relative path', function() {
			var request = site.root( 'custom/endpoint' );
			expect( request._renderURI() ).to.equal( 'http://my.site.com/wp-json/custom/endpoint' );
		});

		it( 'creates a WPRequest object', function() {
			var pathRequest = site.root( 'some/collection/endpoint' );
			expect( pathRequest instanceof WPRequest ).to.be.true;
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
			expect( site ).to.have.property( 'media' );
			expect( site.media ).to.be.a( 'function' );
		});

		it( 'defines a pages endpoint handler', function() {
			expect( site ).to.have.property( 'pages' );
			expect( site.pages ).to.be.a( 'function' );
		});

		it( 'defines a posts endpoint handler', function() {
			expect( site ).to.have.property( 'posts' );
			expect( site.posts ).to.be.a( 'function' );
		});

		it( 'defines a taxonomies endpoint handler', function() {
			expect( site ).to.have.property( 'taxonomies' );
			expect( site.taxonomies ).to.be.a( 'function' );
		});

		it( 'defines a categories endpoint handler', function() {
			expect( site ).to.have.property( 'categories' );
			expect( site.categories ).to.be.a( 'function' );
		});

		it( 'defines a tags endpoint handler', function() {
			expect( site ).to.have.property( 'tags' );
			expect( site.tags ).to.be.a( 'function' );
		});

		it( 'defines a types endpoint handler', function() {
			expect( site ).to.have.property( 'types' );
			expect( site.types ).to.be.a( 'function' );
		});

		it( 'defines a users endpoint handler', function() {
			expect( site ).to.have.property( 'users' );
			expect( site.users ).to.be.a( 'function' );
		});

	});

});
