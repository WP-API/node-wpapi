'use strict';
var chai = require( 'chai' );
var expect = chai.expect;

var WPRequest = require( '../../../lib/constructors/wp-request' );
var registerRoute = require( '../../../lib/wp-register-route' );

describe( 'wp.registerRoute', function() {

	it( 'is a function', function() {
		expect( registerRoute ).to.be.a( 'function' );
	});

	it( 'returns a function', function() {
		expect( registerRoute( 'a', 'b' ) ).to.be.a( 'function' );
	});

	it( 'sets a Ctor property on the returned function', function() {
		var result = registerRoute( 'a', 'b' );
		expect( result ).to.have.property( 'Ctor' );
	});

	it( 'returns a factory that returns Ctor instances', function() {
		var result = registerRoute( 'a', 'b' );
		expect( result() ).to.be.an.instanceOf( result.Ctor );
	});

	it( 'returns a factory for an object which extends WPRequest', function() {
		var result = registerRoute( 'a', 'b' );
		expect( result() ).to.be.an.instanceOf( WPRequest );
	});

	// custom route example for wp-api.org
	describe( 'handler for /author/(?P<id>\\d+)', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)' );
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'renders a route prefixed with the provided namespace', function() {
			expect( handler.toString().match( /myplugin\/v1/ ) ).to.be.ok;
		});

		it( 'sets the /authors/ path part automatically', function() {
			expect( handler.toString() ).to.equal( '/myplugin/v1/author' );
		});

		describe( '.id() method', function() {

			it( 'is defined', function() {
				expect( handler ).to.have.property( 'id' );
			});

			it( 'is a function', function() {
				expect( handler.id ).to.be.a( 'function' );
			});

			it( 'sets the ID component of the path', function() {
				expect( handler.id( 3263827 ).toString() ).to.equal( '/myplugin/v1/author/3263827' );
			});

		});

	});

	describe( 'handler for /a/(?P<snake_cased_path_setter>\\d+)', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'ns', '/a/(?P<snake_cased_path_setter>\\d+)' );
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'camelCases the setter name', function() {
			expect( handler ).not.to.have.property( 'snake_cased_path_setter' );
			expect( handler ).to.have.property( 'snakeCasedPathSetter' );
			expect( handler.snakeCasedPathSetter ).to.be.a( 'function' );
		});

	});

	describe( 'handler for /a/(?P<camelCasedPathSetter>\\d+)', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'ns', '/a/(?P<camelCasedPathSetter>\\d+)' );
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'does not mutate the setter name', function() {
			expect( handler ).not.to.have.property( 'camelcasedpathsetter' );
			expect( handler ).to.have.property( 'camelCasedPathSetter' );
			expect( handler.camelCasedPathSetter ).to.be.a( 'function' );
		});

	});

	describe( 'handler for route with capture group named identically to existing method', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'ns', '/route/(?P<param>)' );
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'does not overwrite preexisting methods', function() {
			expect( handler.param ).to.equal( WPRequest.prototype.param );
			expect( handler.param( 'foo', 'bar' ).toString() ).to.equal( '/ns/route?foo=bar' );
			expect( handler.param( 'foo', 'bar' ).toString() ).not.to.equal( '/ns/route/foo' );
		});

	});

	describe( 'handler for consecutive dynamic route segments', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'ns', '/resource/(?P<part1>\\d+)/(?P<part2>\\d+)' );
			handler = factory({
				endpoint: '/'
			});
		});

		describe( 'part1 method', function() {

			it( 'is defined', function() {
				expect( handler ).to.have.property( 'part1' );
			});

			it( 'is a function', function() {
				expect( handler.part1 ).to.be.a( 'function' );
			});

			it( 'sets the part1 component of the path', function() {
				expect( handler.part1( 12 ).toString() ).to.equal( '/ns/resource/12' );
			});

		});

		describe( 'part2 method', function() {

			it( 'is defined', function() {
				expect( handler ).to.have.property( 'part2' );
			});

			it( 'is a function', function() {
				expect( handler.part2 ).to.be.a( 'function' );
			});

			it( 'sets the part2 component of the path', function() {
				expect( handler.part1( 12 ).part2( 34 ).toString() ).to.equal( '/ns/resource/12/34' );
			});

		});

	});

	describe( 'mixins', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				mixins: {
					foo: function() {
						return this.param( 'foo', true );
					},
					bar: function( val ) {
						return this.param( 'bar', val );
					}
				}
			});
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'are set on the prototype of the handler constructor', function() {
			expect( handler ).to.have.property( 'foo' );
			expect( handler ).not.to.have.ownProperty( 'foo' );
			expect( handler.foo ).to.be.a( 'function' );
			expect( handler ).to.have.property( 'bar' );
			expect( handler ).not.to.have.ownProperty( 'bar' );
			expect( handler.bar ).to.be.a( 'function' );
		});

		it( 'can set URL query parameters', function() {
			expect( handler.foo().toString() ).to.equal( '/myplugin/v1/author?foo=true' );
		});

		it( 'can set dynamic URL query parameter values', function() {
			expect( handler.bar( '1138' ).toString() ).to.equal( '/myplugin/v1/author?bar=1138' );
		});

		it( 'will not overwrite existing endpoint handler prototype methods', function() {
			var factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				mixins: {
					id: function() {
						return this.param( 'id', 'as_a_param' );
					}
				}
			});
			var result = factory({
				endpoint: '/'
			}).id( 7 ).toString();
			expect( result ).not.to.equal( '/myplugin/v1/author?id=as_a_param' );
			expect( result ).to.equal( '/myplugin/v1/author/7' );
		});

	});

	describe( 'handler for multi-capture group route', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'wp/v2', 'pages/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)' );
			handler = factory({
				endpoint: '/'
			});
		});

		it( 'sets the first static level of the route automatically', function() {
			expect( handler.toString() ).to.equal( '/wp/v2/pages' );
		});

		it( 'permits the first dynamic level of the route to be set with .parent', function() {
			expect( handler.parent( 79 ).toString() ).to.equal( '/wp/v2/pages/79' );
		});

		it( 'permits the second static level of the route to be set with .revisions', function() {
			expect( handler.parent( 79 ).revisions().toString() ).to.equal( '/wp/v2/pages/79/revisions' );
		});

		it( 'permits the second dynamic level of the route to be set with .id', function() {
			expect( handler.parent( 79 ).revisions().id( 97 ).toString() ).to.equal( '/wp/v2/pages/79/revisions/97' );
		});

		it( 'throws an error if the parts of the route provided are not contiguous', function() {
			expect(function() {
				handler.parent( 101 ).id( 102 ).toString();
			}).to.throw();
		});

	});

	describe( 'handler validation', function() {
		var handler;

		it( 'can be enforced by providing a regex for a capture group', function() {
			var factory = registerRoute( 'myplugin', 'one/(?P<a>\\w+_\\d+)' );
			handler = factory({
				endpoint: '/'
			});
			expect(function() {
				handler.a( 'foo' ).toString();
			}).to.throw;
			expect( handler.a( 'foo_100' ).toString() ).to.equal( '/myplugin/one/foo_100' );
		});

		it( 'can be bypassed if no regex is provided for a capture group', function() {
			var factory = registerRoute( 'myplugin', 'one/(?P<a>)/two/(?P<b>)' );
			handler = factory({
				endpoint: '/'
			});
			expect(function() {
				handler.a( 'foo' ).two().b( 1000 ).toString();
			}).not.to.throw;
			expect( handler.a( 'foo' ).two( 1000 ).toString() ).to.equal( '/myplugin/one/foo/two/1000' );
		});

	});

	describe( 'method option:', function() {
		var handler;

		beforeEach(function() {
			var factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
				methods: [ 'GET', 'POST' ]
			});
			handler = factory({
				endpoint: '/'
			});
		});

		describe( 'leaf nodes', function() {

			describe( 'support whitelisted method', function() {

				[ 'get', 'post' ].forEach(function( method ) {
					it( method, function() {
						expect(function() {
							handler.a( 1 ).b( 2 )._checkMethodSupport( method );
						}).not.to.throw();
					});
				});

			});

			describe( 'blacklist method', function() {

				[ 'delete', 'put' ].forEach(function( method ) {
					it( method, function() {
						expect(function() {
							handler.a( 1 ).b( 2 )._checkMethodSupport( method );
						}).to.throw();
					});
				});

			});

			it( 'support "head" implicitly if "get" is whitelisted', function() {
				expect(function() { handler.a( 1 ).b( 2 )._checkMethodSupport( 'head' ); }).not.to.throw();
			});

			it( 'support "get" implicitly if "head" is whitelisted', function() {
				var factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
					methods: [ 'HEAD' ]
				});
				handler = factory({
					endpoint: '/'
				});
				expect(function() { handler.a( 1 ).b( 2 )._checkMethodSupport( 'head' ); }).not.to.throw();
			});

		});

		describe( 'non-leaf nodes', function() {

			describe( 'support all methods', function() {

				[ 'get', 'post', 'head', 'put', 'delete' ].forEach(function( method ) {
					it( method, function() {
						expect(function() {
							handler.a( 1 )._checkMethodSupport( method );
						}).not.to.throw();
					});
				});

			});

		});

		describe( 'specified as a string', function() {

			beforeEach(function() {
				var factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
					methods: 'POST'
				});
				handler = factory({
					endpoint: '/'
				});
			});

			it( 'is properly whitelisted', function() {
				expect(function() { handler.a( 1 ).b( 2 )._checkMethodSupport( 'post' ); }).not.to.throw();
			});

			describe( 'implicitly blacklists other method', function() {

				[ 'get', 'head', 'delete', 'put' ].forEach(function( method ) {
					it( method, function() {
						expect(function() {
							handler.a( 1 ).b( 2 )._checkMethodSupport( method );
						}).to.throw();
					});
				});

			});

		});

	});

	describe( 'handler options', function() {

		it( 'can be passed in to the factory method', function() {
			var factory = registerRoute( 'myplugin', 'myroute' );
			expect( factory({ endpoint: '/wp-yaml/' }).toString() ).to.equal( '/wp-yaml/myplugin/myroute' );
		});

		it( 'correctly defaults to the containing object\'s _options, if present', function() {
			var obj = {
				factory: registerRoute( 'myplugin', 'myroute' ),
				_options: {
					endpoint: '/foo/'
				}
			};
			expect( obj.factory().toString() ).to.equal( '/foo/myplugin/myroute' );
		});

	});

});
