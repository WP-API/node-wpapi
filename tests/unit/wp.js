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

		it( 'is a function', function() {
			expect( WP ).to.have.property( 'site' );
			expect( WP.site ).to.be.a( 'function' );
		});

		it( 'creates and returns a new WP instance', function() {
			var site = WP.site( 'endpoint/url' );
			expect( site instanceof WP ).to.be.true;
			expect( site._options.endpoint ).to.equal( 'endpoint/url/' );
		});

		it( 'can take a routes configuration object to bootstrap the returned instance', function() {
			var site = WP.site( 'endpoint/url', {
				'/wp/v2/posts': {
					namespace: 'wp/v2',
					methods: [ 'GET' ],
					endpoints: [ {
						methods: [ 'GET' ],
						args: {
							filter: { required: false }
						}
					} ]
				}
			});
			expect( site instanceof WP ).to.be.true;
			expect( site.posts ).to.be.a( 'function' );
			expect( site ).not.to.have.property( 'comments' );
			expect( site.posts() ).not.to.have.property( 'id' );
			expect( site.posts().filter ).to.be.a( 'function' );
			expect( site.posts()._renderURI() ).to.equal( 'endpoint/url/wp/v2/posts' );
		});

	});

	describe( '.namespace()', function() {

		it( 'is a function', function() {
			expect( site ).to.have.property( 'namespace' );
			expect( site.namespace ).to.be.a( 'function' );
		});

		it( 'returns a namespace object with relevant endpoint handler methods', function() {
			var wpV2 = site.namespace( 'wp/v2' );
			// Spot check
			expect( wpV2 ).to.be.an( 'object' );
			expect( wpV2 ).to.have.property( 'posts' );
			expect( wpV2.posts ).to.be.a( 'function' );
			expect( wpV2 ).to.have.property( 'comments' );
			expect( wpV2.comments ).to.be.a( 'function' );
		});

		it( 'passes options from the parent WP instance to the namespaced handlers', function() {
			site.auth( 'u', 'p' );
			var pages = site.namespace( 'wp/v2' ).pages();
			expect( pages._options ).to.be.an( 'object' );
			expect( pages._options ).to.have.property( 'username' );
			expect( pages._options.username ).to.equal( 'u' );
			expect( pages._options ).to.have.property( 'password' );
			expect( pages._options.password ).to.equal( 'p' );
		});

		it( 'permits the namespace to be stored in a variable without disrupting options', function() {
			site.auth( 'u', 'p' );
			var wpV2 = site.namespace( 'wp/v2' );
			var pages = wpV2.pages();
			expect( pages._options ).to.be.an( 'object' );
			expect( pages._options ).to.have.property( 'username' );
			expect( pages._options.username ).to.equal( 'u' );
			expect( pages._options ).to.have.property( 'password' );
			expect( pages._options.password ).to.equal( 'p' );
		});

		it( 'throws an error when provided no namespace', function() {
			expect(function() {
				site.namespace();
			}).to.throw();
		});

		it( 'throws an error when provided an unregistered namespace', function() {
			expect(function() {
				site.namespace( 'foo/baz' );
			}).to.throw();
		});

	});

	describe( '.bootstrap()', function() {

		beforeEach(function() {
			site.bootstrap({
				'/myplugin/v1/authors/(?P<name>[\\w-]+)': {
					namespace: 'myplugin/v1',
					methods: [ 'GET', 'POST' ],
					endpoints: [ {
						methods: [ 'GET' ],
						args: {
							name: { required: false }
						}
					} ]
				},
				'/wp/v2/customendpoint/(?P<thing>[\\w-]+)': {
					namespace: 'wp/v2',
					methods: [ 'GET', 'POST' ],
					endpoints: [ {
						methods: [ 'GET' ],
						args: {
							parent: { required: false }
						}
					} ]
				}
			});
		});

		it( 'is a function', function() {
			expect( site ).to.have.property( 'bootstrap' );
			expect( site.bootstrap ).to.be.a( 'function' );
		});

		it( 'is chainable', function() {
			expect( site.bootstrap() ).to.equal( site );
		});

		it( 'creates handlers for all provided route definitions', function() {
			expect( site.namespace( 'myplugin/v1' ) ).to.be.an( 'object' );
			expect( site.namespace( 'myplugin/v1' ) ).to.have.property( 'authors' );
			expect( site.namespace( 'myplugin/v1' ).authors ).to.be.a( 'function' );
			expect( site.namespace( 'wp/v2' ) ).to.be.an( 'object' );
			expect( site.namespace( 'wp/v2' ) ).to.have.property( 'customendpoint' );
			expect( site.namespace( 'wp/v2' ).customendpoint ).to.be.a( 'function' );
		});

		it( 'properly assigns setter methods for detected path parts', function() {
			var thingHandler = site.customendpoint();
			expect( thingHandler ).to.have.property( 'thing' );
			expect( thingHandler.thing ).to.be.a( 'function' );
			expect( thingHandler.thing( 'foobar' )._renderURI() ).to.equal( 'endpoint/url/wp/v2/customendpoint/foobar' );
		});

		it( 'assigns any mixins for detected GET arguments for custom namespace handlers', function() {
			var authorsHandler = site.namespace( 'myplugin/v1' ).authors();
			expect( authorsHandler ).to.have.property( 'name' );
			expect( authorsHandler ).not.to.have.ownProperty( 'name' );
			expect( authorsHandler.name ).to.be.a( 'function' );
			var customEndpoint = site.customendpoint();
			expect( customEndpoint ).to.have.property( 'parent' );
			expect( customEndpoint ).not.to.have.ownProperty( 'parent' );
			expect( customEndpoint.parent ).to.be.a( 'function' );
		});

		it( 'assigns handlers for wp/v2 routes to the instance object itself', function() {
			expect( site ).to.have.property( 'customendpoint' );
			expect( site.customendpoint ).to.be.a( 'function' );
			expect( site.namespace( 'wp/v2' ).customendpoint ).to.equal( site.customendpoint );
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

	describe( 'auth', function() {

		beforeEach(function() {
			site = new WP({ endpoint: 'http://my.site.com/wp-json' });
		});

		it( 'is defined', function() {
			expect( site ).to.have.property( 'auth' );
			expect( site.auth ).to.be.a( 'function' );
		});

		it( 'sets the "auth" option to "true"', function() {
			expect( site._options ).not.to.have.property( 'auth' );
			site.auth();
			expect( site._options ).to.have.property( 'auth' );
			expect( site._options.auth ).to.be.true;
		});

		it( 'sets the username and password when provided as strings', function() {
			site.auth( 'user1', 'pass1' );
			expect( site._options ).to.have.property( 'username' );
			expect( site._options ).to.have.property( 'password' );
			expect( site._options.username ).to.equal( 'user1' );
			expect( site._options.password ).to.equal( 'pass1' );
			expect( site._options ).to.have.property( 'auth' );
			expect( site._options.auth ).to.be.true;
		});

		it( 'sets the username and password when provided in an object', function() {
			site.auth({
				username: 'user1',
				password: 'pass1'
			});
			expect( site._options ).to.have.property( 'username' );
			expect( site._options ).to.have.property( 'password' );
			expect( site._options.username ).to.equal( 'user1' );
			expect( site._options.password ).to.equal( 'pass1' );
			expect( site._options ).to.have.property( 'auth' );
			expect( site._options.auth ).to.be.true;
		});

		it( 'passes authentication status to all subsequently-instantiated handlers', function() {
			site.auth({
				username: 'user',
				password: 'pass'
			});
			var req = site.root( '' );
			expect( req ).to.have.property( '_options' );
			expect( req._options ).to.be.an( 'object' );
			expect( req._options ).to.have.property( 'username' );
			expect( req._options.username ).to.equal( 'user' );
			expect( req._options ).to.have.property( 'password' );
			expect( req._options.password ).to.equal( 'pass' );
			expect( req._options ).to.have.property( 'password' );
			expect( req._options.auth ).to.equal( true );
		});

	}); // auth

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

	describe( '.discover()', function() {

		it( 'is a function', function() {
			expect( WP ).to.have.property( 'discover' );
			expect( WP.discover ).to.be.a( 'function' );
		});

	});

});
