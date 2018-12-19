'use strict';

const WPRequest = require( '../../../lib/constructors/wp-request' );
const registerRoute = require( '../../../lib/wp-register-route' );
const checkMethodSupport = require( '../../../lib/util/check-method-support' );
const mixins = require( '../../../lib/mixins' );

describe( 'wp.registerRoute', () => {

	it( 'is a function', () => {
		expect( typeof registerRoute ).toBe( 'function' );
	} );

	it( 'returns a function', () => {
		expect( typeof registerRoute( 'a', 'b' ) ).toBe( 'function' );
	} );

	it( 'sets a Ctor property on the returned function', () => {
		const result = registerRoute( 'a', 'b' );
		expect( result ).toHaveProperty( 'Ctor' );
	} );

	it( 'returns a factory that returns Ctor instances', () => {
		const result = registerRoute( 'a', 'b' );
		expect( result() ).toBeInstanceOf( result.Ctor );
	} );

	it( 'returns a factory for an object which extends WPRequest', () => {
		const result = registerRoute( 'a', 'b' );
		expect( result() ).toBeInstanceOf( WPRequest );
	} );

	it( 'factory-generated handlers have all the expected WPRequest methods', () => {
		const factory = registerRoute( 'a', 'b' );
		const handler = factory( {
			endpoint: '/',
		} );
		// spot check
		expect( typeof handler.page ).toBe( 'function' );
		expect( typeof handler.perPage ).toBe( 'function' );
		expect( typeof handler.offset ).toBe( 'function' );
		expect( typeof handler.context ).toBe( 'function' );
		expect( typeof handler.include ).toBe( 'function' );
		expect( typeof handler.slug ).toBe( 'function' );
		const result = handler.page( 7 ).perPage( 2 ).exclude( [ 42, 7 ] ).toString();
		expect( result ).toBe( '/a/b?exclude%5B%5D=42&exclude%5B%5D=7&page=7&per_page=2' );
	} );

	// custom route example for wp-api.org
	describe( 'handler for /author/(?P<id>\\d+)', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'renders a route prefixed with the provided namespace', () => {
			expect( handler.toString() ).toMatch( /myplugin\/v1/ );
		} );

		it( 'sets the /authors/ path part automatically', () => {
			expect( handler.toString() ).toBe( '/myplugin/v1/author' );
		} );

		describe( '.id() method', () => {

			it( 'is defined', () => {
				expect( handler ).toHaveProperty( 'id' );
			} );

			it( 'is a function', () => {
				expect( typeof handler.id ).toBe( 'function' );
			} );

			it( 'sets the ID component of the path', () => {
				expect( handler.id( 3263827 ).toString() ).toBe( '/myplugin/v1/author/3263827' );
			} );

		} );

	} );

	// Example of a Jetpack route with regexes containing forward slashes
	describe( 'handler for /jetpack/v4/plugin/(?P<plugin>[a-z\\/\\.\\-_]+)', () => {

		it( 'permits setting path parts with forward slashes', () => {
			const factory = registerRoute( 'jetpack/v4', '/plugin/(?P<plugin>[a-z\\/\\.\\-_]+)' );
			const handler = factory( {
				endpoint: '/',
			} );
			expect( handler ).toHaveProperty( 'plugin' );
			expect( typeof handler.plugin ).toBe( 'function' );
			expect( handler.plugin( 'a/b_c' ).toString() ).toBe( '/jetpack/v4/plugin/a/b_c' );
		} );

	} );

	describe( 'handler for /plugin/(?P<plugin_slug>[^/]+)/committers/?)', () => {

		it( 'will ignore the trailing /? (the ? is intended to mark the / as optional', () => {
			const factory = registerRoute( 'plugins/v1', '/plugin/(?P<plugin_slug>[^/]+)/committers/?' );
			const handler = factory( {
				endpoint: '/',
			} );
			expect( handler ).toHaveProperty( 'pluginSlug' );
			expect( typeof handler.pluginSlug ).toBe( 'function' );
			expect( handler ).toHaveProperty( 'committers' );
			expect( typeof handler.committers ).toBe( 'function' );
			expect( handler.pluginSlug( 'rest-api' ).committers().toString() ).toBe( '/plugins/v1/plugin/rest-api/committers' );
		} );

	} );

	describe( 'handler for unsupported route definition format', () => {

		it( 'will parse the route without error but not yield functioning setters', () => {
			let factory;
			expect( () => {
				factory = registerRoute(
					'mmw/v1',
					'/users/market=(?P<market>[a-zA-Z0-9-]+)/lat=(?P<lat>[a-z0-9 .\\-]+)/long=(?P<long>[a-z0-9 .\\-]+)'
				);
			} ).not.toThrow();
			const handler = factory( {
				endpoint: '/',
			} );
			expect( handler ).toHaveProperty( 'market' );
			expect( typeof handler.market ).toBe( 'function' );
			expect( handler ).toHaveProperty( 'lat' );
			expect( typeof handler.lat ).toBe( 'function' );
			expect( handler ).toHaveProperty( 'long' );
			expect( typeof handler.long ).toBe( 'function' );
			// This is not "correct", but this syntax is not supported: the purpose of this
			// test is to ensure that the code executes without error
			expect( handler.market( 'nz' ).lat( '40.9006 S' ).long( '174.8860 E' ).toString() )
				.toBe( '/mmw/v1/users/nz/40.9006 S/174.8860 E' );
		} );

	} );

	describe( 'handler for /a/(?P<snake_cased_path_setter>\\d+)', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'ns', '/a/(?P<snake_cased_path_setter>\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'camelCases the setter name', () => {
			expect( handler ).not.toHaveProperty( 'snake_cased_path_setter' );
			expect( handler ).toHaveProperty( 'snakeCasedPathSetter' );
			expect( typeof handler.snakeCasedPathSetter ).toBe( 'function' );
		} );

	} );

	describe( 'handler for /a/(?P<kebab-cased-path-setter>\\d+)', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'ns', '/a/(?P<kebab-cased-path-setter>\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'camelCases the setter name', () => {
			expect( handler ).not.toHaveProperty( 'kebab-cased-path-setter' );
			expect( handler ).toHaveProperty( 'kebabCasedPathSetter' );
			expect( typeof handler.kebabCasedPathSetter ).toBe( 'function' );
		} );

	} );

	describe( 'handler for /a/(?P<camelCasedPathSetter>\\d+)', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'ns', '/a/(?P<camelCasedPathSetter>\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'does not mutate the setter name', () => {
			expect( handler ).not.toHaveProperty( 'camelcasedpathsetter' );
			expect( handler ).toHaveProperty( 'camelCasedPathSetter' );
			expect( typeof handler.camelCasedPathSetter ).toBe( 'function' );
		} );

	} );

	describe( 'handler for route with capture group named identically to existing method', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'ns', '/route/(?P<param>)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'does not overwrite preexisting methods', () => {
			expect( handler.param ).toBe( WPRequest.prototype.param );
			expect( handler.param( 'foo', 'bar' ).toString() ).toBe( '/ns/route?foo=bar' );
			expect( handler.param( 'foo', 'bar' ).toString() ).not.toBe( '/ns/route/foo' );
		} );

	} );

	describe( 'handler for consecutive dynamic route segments', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'ns', '/resource/(?P<part1>\\d+)/(?P<part2>\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		describe( 'part1 method', () => {

			it( 'is defined', () => {
				expect( handler ).toHaveProperty( 'part1' );
			} );

			it( 'is a function', () => {
				expect( typeof handler.part1 ).toBe( 'function' );
			} );

			it( 'sets the part1 component of the path', () => {
				expect( handler.part1( 12 ).toString() ).toBe( '/ns/resource/12' );
			} );

		} );

		describe( 'part2 method', () => {

			it( 'is defined', () => {
				expect( handler ).toHaveProperty( 'part2' );
			} );

			it( 'is a function', () => {
				expect( typeof handler.part2 ).toBe( 'function' );
			} );

			it( 'sets the part2 component of the path', () => {
				expect( handler.part1( 12 ).part2( 34 ).toString() ).toBe( '/ns/resource/12/34' );
			} );

		} );

	} );

	describe( 'parameters', () => {
		let handler;

		it( 'assign any mixins that match provided parameter names', () => {
			const factory = registerRoute( 'a', '/b', {
				params: [ 'filter', 'author' ],
			} );
			handler = factory( {
				endpoint: '/',
			} );
			expect( handler ).toHaveProperty( 'filter' );
			expect( handler.filter ).toBe( mixins.filter.filter );
			expect( handler ).toHaveProperty( 'author' );
			expect( handler.author ).toBe( mixins.author.author );
		} );

		it( 'does nothing if non-string parameters are provided', () => {
			const factory1 = registerRoute( 'a', 'b' );
			const factory2 = registerRoute( 'a', 'b', {
				params: [ null, () => {} ],
			} );
			expect( factory1 ).not.toBe( factory2 );
			expect( factory1.Ctor ).not.toBe( factory2.Ctor );
			const getPrototypeMethods = ( factoryFn ) => {
				const proto = factoryFn.Ctor.prototype;
				return Object.keys( proto ).filter( key => typeof proto[ key ] === 'function' );
			};
			const factory1PrototypeMethods = getPrototypeMethods( factory1 );
			const factory2PrototypeMethods = getPrototypeMethods( factory2 );
			expect( factory1PrototypeMethods ).toEqual( factory2PrototypeMethods );
		} );

		it( 'creates a .param() wrapper for params that do not match existing mixins', () => {
			const factory = registerRoute( 'a', 'b', {
				params: [ 'customtax', 'someparam' ],
			} );
			handler = factory( {
				endpoint: '/',
			} );
			expect( handler ).toHaveProperty( 'customtax' );
			expect( typeof handler.customtax ).toBe( 'function' );
			expect( handler ).toHaveProperty( 'someparam' );
			expect( typeof handler.someparam ).toBe( 'function' );
			const result = handler.customtax( 'techno' ).someparam( [
				'tech',
				'yes',
			] );
			expect( result.toString() ).toBe( '/a/b?customtax=techno&someparam%5B%5D=tech&someparam%5B%5D=yes' );
		} );

		it( 'will not overwrite existing methods', () => {
			const factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				params: [ 'param', 'edit', 'id' ],
			} );
			handler = factory( {
				endpoint: '/',
			} );
			const result = handler.id( 7 ).param( 'a', 'b' ).edit().toString();
			expect( result ).toBe( '/myplugin/v1/author/7?a=b&context=edit' );
		} );

	} );

	describe( 'mixins', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				mixins: {
					foo() {
						return this.param( 'foo', true );
					},
					bar( val ) {
						return this.param( 'bar', val );
					},
				},
			} );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'are set on the prototype of the handler constructor', () => {
			expect( handler ).toHaveProperty( 'foo' );
			expect( handler.hasOwnProperty( 'foo' ) ).toBe( false );
			expect( typeof handler.foo ).toBe( 'function' );
			expect( handler ).toHaveProperty( 'bar' );
			expect( handler.hasOwnProperty( 'bar' ) ).toBe( false );
			expect( typeof handler.bar ).toBe( 'function' );
		} );

		it( 'can set URL query parameters', () => {
			expect( handler.foo().toString() ).toBe( '/myplugin/v1/author?foo=true' );
		} );

		it( 'can set dynamic URL query parameter values', () => {
			expect( handler.bar( '1138' ).toString() ).toBe( '/myplugin/v1/author?bar=1138' );
		} );

		it( 'will not overwrite existing endpoint handler prototype methods', () => {
			const factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				mixins: {
					id() {
						return this.param( 'id', 'as_a_param' );
					},
				},
			} );
			const result = factory( {
				endpoint: '/',
			} ).id( 7 ).toString();
			expect( result ).not.toBe( '/myplugin/v1/author?id=as_a_param' );
			expect( result ).toBe( '/myplugin/v1/author/7' );
		} );

		it( 'will not overwrite WPRequest default methods', () => {
			const factory = registerRoute( 'myplugin/v1', '/author/(?P<id>\\d+)', {
				mixins: {
					param() {
						throw new Error();
					},
				},
			} );
			const result = factory( {
				endpoint: '/',
			} ).id( 7 ).param( 'a', 'b' ).toString();
			expect( result ).toBe( '/myplugin/v1/author/7?a=b' );
		} );

	} );

	describe( 'handler for multi-capture group route', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'wp/v2', 'pages/(?P<parent>[\\d]+)/revisions/(?P<id>[\\d]+)' );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		it( 'sets the first static level of the route automatically', () => {
			expect( handler.toString() ).toBe( '/wp/v2/pages' );
		} );

		it( 'permits the first dynamic level of the route to be set with .parent', () => {
			expect( handler.parent( 79 ).toString() ).toBe( '/wp/v2/pages/79' );
		} );

		it( 'permits the second static level of the route to be set with .revisions', () => {
			expect( handler.parent( 79 ).revisions().toString() ).toBe( '/wp/v2/pages/79/revisions' );
		} );

		it( 'permits the second dynamic level of the route to be set with .id', () => {
			expect( handler.parent( 79 ).revisions().id( 97 ).toString() ).toBe( '/wp/v2/pages/79/revisions/97' );
		} );

		it( 'throws an error if the parts of the route provided are not contiguous', () => {
			expect( () => {
				handler.parent( 101 ).id( 102 ).toString();
			} ).toThrow();
		} );

	} );

	describe( 'handler validation', () => {
		let handler;

		it( 'can be enforced by providing a regex for a capture group', () => {
			const factory = registerRoute( 'myplugin', 'one/(?P<a>\\w+_\\d+)' );
			handler = factory( {
				endpoint: '/',
			} );
			expect( () => {
				handler.a( 'foo' ).toString();
			} ).toThrow;
			expect( handler.a( 'foo_100' ).toString() ).toBe( '/myplugin/one/foo_100' );
		} );

		it( 'can be bypassed if no regex is provided for a capture group', () => {
			const factory = registerRoute( 'myplugin', 'one/(?P<a>)/two/(?P<b>)' );
			handler = factory( {
				endpoint: '/',
			} );
			expect( () => {
				handler.a( 'foo' ).two().b( 1000 ).toString();
			} ).not.toThrow;
			expect( handler.a( 'foo' ).two( 1000 ).toString() ).toBe( '/myplugin/one/foo/two/1000' );
		} );

	} );

	describe( 'method option:', () => {
		let handler;

		beforeEach( () => {
			const factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
				methods: [ 'GET', 'POST' ],
			} );
			handler = factory( {
				endpoint: '/',
			} );
		} );

		describe( 'leaf nodes', () => {

			describe( 'support whitelisted method', () => {

				[ 'get', 'post' ].forEach( ( method ) => {
					it( method, () => {
						expect( () => {
							checkMethodSupport( method, handler.a( 1 ).b( 2 ) );
						} ).not.toThrow();
					} );
				} );

			} );

			describe( 'blacklist method', () => {

				[ 'delete', 'put' ].forEach( ( method ) => {
					it( method, () => {
						expect( () => {
							checkMethodSupport( method, handler.a( 1 ).b( 2 ) );
						} ).toThrow();
					} );
				} );

			} );

			it( 'support "head" implicitly if "get" is whitelisted', () => {
				expect( () => {
					checkMethodSupport( 'head', handler.a( 1 ).b( 2 ) );
				} ).not.toThrow();
			} );

			it( 'support "get" implicitly if "head" is whitelisted', () => {
				const factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
					methods: [ 'HEAD' ],
				} );
				handler = factory( {
					endpoint: '/',
				} );
				expect( () => {
					checkMethodSupport( 'head', handler.a( 1 ).b( 2 ) );
				} ).not.toThrow();
			} );

		} );

		describe( 'non-leaf nodes', () => {

			describe( 'support all methods', () => {

				[ 'get', 'post', 'head', 'put', 'delete' ].forEach( ( method ) => {
					it( method, () => {
						expect( () => {
							checkMethodSupport( method, handler.a( 1 ) );
						} ).not.toThrow();
					} );
				} );

			} );

		} );

		describe( 'specified as a string', () => {

			beforeEach( () => {
				const factory = registerRoute( 'myplugin', 'one/(?P<a>)/(?P<b>)', {
					methods: 'POST',
				} );
				handler = factory( {
					endpoint: '/',
				} );
			} );

			it( 'is properly whitelisted', () => {
				expect( () => {
					checkMethodSupport( 'post', handler.a( 1 ).b( 2 ) );
				} ).not.toThrow();
			} );

			describe( 'implicitly blacklists other method', () => {

				[ 'get', 'head', 'delete', 'put' ].forEach( ( method ) => {
					it( method, () => {
						expect( () => {
							checkMethodSupport( method, handler.a( 1 ).b( 2 ) );
						} ).toThrow();
					} );
				} );

			} );

		} );

	} );

	describe( 'handler options', () => {

		it( 'can be passed in to the factory method', () => {
			const factory = registerRoute( 'myplugin', 'myroute' );
			expect( factory( { endpoint: '/wp-yaml/' } ).toString() ).toBe( '/wp-yaml/myplugin/myroute' );
		} );

		it( 'correctly defaults to the containing object\'s _options, if present', () => {
			const obj = {
				factory: registerRoute( 'myplugin', 'myroute' ),
				_options: {
					endpoint: '/foo/',
				},
			};
			expect( obj.factory().toString() ).toBe( '/foo/myplugin/myroute' );
		} );

	} );

} );
