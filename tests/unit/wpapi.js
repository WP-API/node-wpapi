'use strict';

const WPAPI = require( '../../' );

// Constructors, for use with instanceof checks
const WPRequest = require( '../../lib/constructors/wp-request' );

describe( 'WPAPI', () => {

	let site;

	beforeEach( () => {
		site = new WPAPI( { endpoint: 'endpoint/url' } );
	} );

	describe( 'constructor', () => {

		it( 'enforces new', () => {
			const site1 = new WPAPI( { endpoint: '/' } );
			expect( site1 instanceof WPAPI ).toBe( true );
			const site2 = WPAPI( { endpoint: '/' } );
			expect( site2 instanceof WPAPI ).toBe( true );
		} );

		it( 'throws an error if no endpoint is provided', () => {
			expect( () => {
				new WPAPI( { endpoint: '/' } );
			} ).not.toThrow();
			expect( () => {
				new WPAPI();
			} ).toThrow();
		} );

		it( 'throws an error if a non-string endpoint is provided', () => {
			expect( () => {
				new WPAPI( { endpoint: 42 } );
			} ).toThrow();
			expect( () => {
				new WPAPI( { endpoint: [] } );
			} ).toThrow();
			expect( () => {
				new WPAPI( { endpoint: { lob: 'ster' } } );
			} ).toThrow();
		} );

		it( 'sets options on an instance variable', () => {
			const site = new WPAPI( {
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky',
			} );
			expect( site._options.endpoint ).toBe( 'http://some.url.com/wp-json/' );
			expect( site._options.username ).toBe( 'fyodor' );
			expect( site._options.password ).toBe( 'dostoyevsky' );
		} );

		it( 'activates authentication when credentials are provided', () => {
			const site = new WPAPI( {
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky',
			} );
			expect( site._options.username ).toBe( 'fyodor' );
			expect( site._options.password ).toBe( 'dostoyevsky' );
			expect( site._options.auth ).toBe( true );
		} );

		describe( 'custom HTTP transport methods', () => {

			beforeEach( () => {
				WPAPI.transport = {
					get: jest.fn().mockImplementation( () => {} ),
					post: jest.fn().mockImplementation( () => {} ),
					put: jest.fn().mockImplementation( () => {} ),
				};
			} );

			it( 'can be set for an individual HTTP action', () => {
				const customGet = jest.fn();
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet,
					},
				} );
				const query = site.root( '' );
				query.get();
				expect( customGet ).toHaveBeenCalledWith( query );
				expect( WPAPI.transport.get ).not.toHaveBeenCalled();
				WPAPI.transport.get.mockRestore();
			} );

			it( 'can extend the default HTTP transport methods', () => {
				const customGet = jest.fn( ( ...args ) => {
					WPAPI.transport.get.apply( null, args );
				} );
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet,
					},
				} );
				const query = site.root( '' );
				query.get();
				expect( customGet ).toHaveBeenCalledWith( query );
				expect( WPAPI.transport.get ).toHaveBeenCalledWith( query );
				WPAPI.transport.get.mockRestore();
			} );

			it( 'can be set for multiple HTTP actions', () => {
				const customPost = jest.fn();
				const customPut = jest.fn();
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						post: customPost,
						put: customPut,
					},
				} );
				const query = site.root( 'a-resource' );
				const data = {};
				query.create( data );
				expect( customPost ).toHaveBeenCalledWith( query, data );
				expect( WPAPI.transport.post ).not.toHaveBeenCalled();
				query.update( data );
				expect( customPut ).toHaveBeenCalledWith( query, data );
				expect( WPAPI.transport.put ).not.toHaveBeenCalled();
				WPAPI.transport.post.mockRestore();
				WPAPI.transport.put.mockRestore();
			} );

			it( 'only apply to a specific WPAPI instance', () => {
				const customGet = jest.fn();
				const site = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet,
					},
				} );
				const site2 = new WPAPI( {
					endpoint: 'http://some.url.com/wp-json',
				} );
				expect( site ).not.toBe( site2 );
				const query = site2.root( '' );
				query.get();
				expect( WPAPI.transport.get ).toHaveBeenCalledWith( query );
				expect( customGet ).not.toHaveBeenCalled();
				WPAPI.transport.get.mockRestore();
			} );

		} );

	} );

	describe( '.site() constructor method', () => {

		it( 'is a function', () => {
			expect( WPAPI ).toHaveProperty( 'site' );
			expect( typeof WPAPI.site ).toBe( 'function' );
		} );

		it( 'creates and returns a new WPAPI instance', () => {
			const site = WPAPI.site( 'endpoint/url' );
			expect( site instanceof WPAPI ).toBe( true );
			expect( site._options.endpoint ).toBe( 'endpoint/url/' );
		} );

		it( 'can take a routes configuration object to bootstrap the returned instance', () => {
			const site = WPAPI.site( 'endpoint/url', {
				'/wp/v2/posts': {
					namespace: 'wp/v2',
					methods: [ 'GET' ],
					endpoints: [ {
						methods: [ 'GET' ],
						args: {
							filter: {},
						},
					} ],
				},
			} );
			expect( site instanceof WPAPI ).toBe( true );
			expect( typeof site.posts ).toBe( 'function' );
			expect( site ).not.toHaveProperty( 'comments' );
			expect( site.posts() ).not.toHaveProperty( 'id' );
			expect( typeof site.posts().filter ).toBe( 'function' );
			expect( site.posts().toString() ).toBe( 'endpoint/url/wp/v2/posts' );
		} );

	} );

	describe( '.prototype', () => {

		describe( '.namespace()', () => {

			it( 'is a function', () => {
				expect( site ).toHaveProperty( 'namespace' );
				expect( typeof site.namespace ).toBe( 'function' );
			} );

			it( 'returns a namespace object with relevant endpoint handler methods', () => {
				const wpV2 = site.namespace( 'wp/v2' );
				// Spot check
				expect( typeof wpV2 ).toBe( 'object' );
				expect( wpV2 ).toHaveProperty( 'posts' );
				expect( typeof wpV2.posts ).toBe( 'function' );
				expect( wpV2 ).toHaveProperty( 'comments' );
				expect( typeof wpV2.comments ).toBe( 'function' );
			} );

			it( 'passes options from the parent WPAPI instance to the namespaced handlers', () => {
				site.auth( {
					username: 'u',
					password: 'p',
				} );
				const pages = site.namespace( 'wp/v2' ).pages();
				expect( typeof pages._options ).toBe( 'object' );
				expect( pages._options ).toHaveProperty( 'username' );
				expect( pages._options.username ).toBe( 'u' );
				expect( pages._options ).toHaveProperty( 'password' );
				expect( pages._options.password ).toBe( 'p' );
			} );

			it( 'permits the namespace to be stored in a variable without disrupting options', () => {
				site.auth( {
					username: 'u',
					password: 'p',
				} );
				const wpV2 = site.namespace( 'wp/v2' );
				const pages = wpV2.pages();
				expect( typeof pages._options ).toBe( 'object' );
				expect( pages._options ).toHaveProperty( 'username' );
				expect( pages._options.username ).toBe( 'u' );
				expect( pages._options ).toHaveProperty( 'password' );
				expect( pages._options.password ).toBe( 'p' );
			} );

			it( 'throws an error when provided no namespace', () => {
				expect( () => {
					site.namespace();
				} ).toThrow();
			} );

			it( 'throws an error when provided an unregistered namespace', () => {
				expect( () => {
					site.namespace( 'foo/baz' );
				} ).toThrow();
			} );

		} );

		describe( '.bootstrap()', () => {

			beforeEach( () => {
				site.bootstrap( {
					'/myplugin/v1/authors/(?P<name>[\\w-]+)': {
						namespace: 'myplugin/v1',
						methods: [ 'GET', 'POST' ],
						endpoints: [ {
							methods: [ 'GET' ],
							args: {
								name: {},
							},
						} ],
					},
					'/wp/v2/customendpoint/(?P<thing>[\\w-]+)': {
						namespace: 'wp/v2',
						methods: [ 'GET', 'POST' ],
						endpoints: [ {
							methods: [ 'GET' ],
							args: {
								parent: {},
							},
						} ],
					},
				} );
			} );

			it( 'is a function', () => {
				expect( site ).toHaveProperty( 'bootstrap' );
				expect( typeof site.bootstrap ).toBe( 'function' );
			} );

			it( 'is chainable', () => {
				expect( site.bootstrap() ).toBe( site );
			} );

			it( 'creates handlers for all provided route definitions', () => {
				expect( typeof site.namespace( 'myplugin/v1' ) ).toBe( 'object' );
				expect( site.namespace( 'myplugin/v1' ) ).toHaveProperty( 'authors' );
				expect( typeof site.namespace( 'myplugin/v1' ).authors ).toBe( 'function' );
				expect( typeof site.namespace( 'wp/v2' ) ).toBe( 'object' );
				expect( site.namespace( 'wp/v2' ) ).toHaveProperty( 'customendpoint' );
				expect( typeof site.namespace( 'wp/v2' ).customendpoint ).toBe( 'function' );
			} );

			it( 'properly assigns setter methods for detected path parts', () => {
				const thingHandler = site.customendpoint();
				expect( thingHandler ).toHaveProperty( 'thing' );
				expect( typeof thingHandler.thing ).toBe( 'function' );
				expect( thingHandler.thing( 'foobar' ).toString() ).toBe( 'endpoint/url/wp/v2/customendpoint/foobar' );
			} );

			it( 'assigns any mixins for detected GET arguments for custom namespace handlers', () => {
				const authorsHandler = site.namespace( 'myplugin/v1' ).authors();
				expect( authorsHandler ).toHaveProperty( 'name' );
				expect( typeof authorsHandler.name ).toBe( 'function' );
				const customEndpoint = site.customendpoint();
				expect( customEndpoint ).toHaveProperty( 'parent' );
				expect( typeof customEndpoint.parent ).toBe( 'function' );
			} );

			it( 'assigns handlers for wp/v2 routes to the instance object itself', () => {
				expect( site ).toHaveProperty( 'customendpoint' );
				expect( typeof site.customendpoint ).toBe( 'function' );
				expect( site.namespace( 'wp/v2' ).customendpoint ).toBe( site.customendpoint );
			} );

		} );

		describe( '.transport()', () => {

			it( 'is defined', () => {
				expect( site ).toHaveProperty( 'transport' );
			} );

			it( 'is a function', () => {
				expect( typeof site.transport ).toBe( 'function' );
			} );

			it( 'is chainable', () => {
				expect( site.transport() ).toBe( site );
			} );

			it( 'sets transport methods on the instance', () => {
				const customGet = jest.fn();
				site.transport( {
					get: customGet,
				} );
				const query = site.root( '' );
				query.get();
				expect( customGet ).toHaveBeenCalledWith( query );
			} );

			it( 'does not impact or overwrite unspecified transport methods', () => {
				const originalMethods = {
					...site._options.transport,
				};
				site.transport( {
					get() {},
					put() {},
				} );
				const newMethods = {
					...site._options.transport,
				};
				expect( newMethods.delete ).toBe( originalMethods.delete );
				expect( newMethods.post ).toBe( originalMethods.post );

				expect( newMethods.get ).not.toBe( originalMethods.get );
				expect( newMethods.put ).not.toBe( originalMethods.put );
			} );

		} );

		describe( '.url()', () => {

			it( 'is defined', () => {
				expect( site ).toHaveProperty( 'url' );
				expect( typeof site.url ).toBe( 'function' );
			} );

			it( 'creates a basic WPRequest object bound to the provided URL', () => {
				const request = site.url( 'http://new-endpoint.com/' );
				expect( request._options ).toHaveProperty( 'endpoint' );
				expect( request._options.endpoint ).toBe( 'http://new-endpoint.com/' );
				expect( request._options ).not.toHaveProperty( 'identifier' );
			} );

		} );

		describe( '.root()', () => {

			beforeEach( () => {
				site = new WPAPI( { endpoint: 'http://my.site.com/wp-json' } );
			} );

			it( 'is defined', () => {
				expect( site ).toHaveProperty( 'root' );
				expect( typeof site.root ).toBe( 'function' );
			} );

			it( 'creates a get request against the root endpoint', () => {
				const pathRequest = site.root( 'some/collection/endpoint' );
				expect( pathRequest instanceof WPRequest ).toBe( true );
			} );

			it( 'inherits options from the parent WPAPI instance', () => {
				const site = new WPAPI( {
					endpoint: 'http://cat.website.com/',
				} );
				const request = site.root( 'custom-path' );
				expect( request._options ).toHaveProperty( 'endpoint' );
				expect( request._options.endpoint ).toBe( 'http://cat.website.com/' );
			} );

		} );

		describe( '.auth()', () => {

			beforeEach( () => {
				site = new WPAPI( { endpoint: 'http://my.site.com/wp-json' } );
			} );

			it( 'is defined', () => {
				expect( site ).toHaveProperty( 'auth' );
				expect( typeof site.auth ).toBe( 'function' );
			} );

			it( 'activates authentication for the site', () => {
				expect( site._options ).not.toHaveProperty( 'auth' );
				site.auth();
				expect( site._options ).toHaveProperty( 'auth' );
				expect( site._options.auth ).toBe( true );
			} );

			it( 'sets the username and password when provided in an object', () => {
				site.auth( {
					username: 'user1',
					password: 'pass1',
				} );
				expect( site._options ).toHaveProperty( 'username' );
				expect( site._options ).toHaveProperty( 'password' );
				expect( site._options.username ).toBe( 'user1' );
				expect( site._options.password ).toBe( 'pass1' );
				expect( site._options ).toHaveProperty( 'auth' );
				expect( site._options.auth ).toBe( true );
			} );

			it( 'can update previously-set usernames and passwords', () => {
				site.auth( {
					username: 'user1',
					password: 'pass1',
				} ).auth( {
					username: 'admin',
					password: 'sandwich',
				} );
				expect( site._options ).toHaveProperty( 'username' );
				expect( site._options ).toHaveProperty( 'password' );
				expect( site._options.username ).toBe( 'admin' );
				expect( site._options.password ).toBe( 'sandwich' );
				expect( site._options ).toHaveProperty( 'auth' );
				expect( site._options.auth ).toBe( true );
			} );

			it( 'sets the nonce when provided in an object', () => {
				site.auth( {
					nonce: 'somenonce',
				} );
				expect( site._options ).toHaveProperty( 'nonce' );
				expect( site._options.nonce ).toBe( 'somenonce' );
				expect( site._options ).toHaveProperty( 'auth' );
				expect( site._options.auth ).toBe( true );
			} );

			it( 'can update nonce credentials', () => {
				site.auth( {
					nonce: 'somenonce',
				} ).auth( {
					nonce: 'refreshednonce',
				} );
				expect( site._options ).toHaveProperty( 'nonce' );
				expect( site._options.nonce ).toBe( 'refreshednonce' );
				expect( site._options ).toHaveProperty( 'auth' );
				expect( site._options.auth ).toBe( true );
			} );

			it( 'passes authentication status to all subsequently-instantiated handlers', () => {
				site.auth( {
					username: 'user',
					password: 'pass',
				} );
				const req = site.root( '' );
				expect( req ).toHaveProperty( '_options' );
				expect( typeof req._options ).toBe( 'object' );
				expect( req._options ).toHaveProperty( 'username' );
				expect( req._options.username ).toBe( 'user' );
				expect( req._options ).toHaveProperty( 'password' );
				expect( req._options.password ).toBe( 'pass' );
				expect( req._options ).toHaveProperty( 'password' );
				expect( req._options.auth ).toBe( true );
			} );

		} );

		describe( '.setHeaders()', () => {

			beforeEach( () => {
				site = new WPAPI( { endpoint: 'http://my.site.com/wp-json' } );
			} );

			it( 'is defined', () => {
				expect( site ).toHaveProperty( 'setHeaders' );
				expect( typeof site.setHeaders ).toBe( 'function' );
			} );

			it( 'initializes site-wide headers object if called with no arguments', () => {
				expect( site._options ).not.toHaveProperty( 'headers' );
				site.setHeaders();
				expect( site._options ).toHaveProperty( 'headers' );
				expect( site._options.headers ).toEqual( {} );
			} );

			it( 'sets site-wide headers when provided a name-value pair', () => {
				site.setHeaders( 'Accept-Language', 'en-US' );
				expect( site._options ).toHaveProperty( 'headers' );
				expect( site._options.headers ).toEqual( {
					'Accept-Language': 'en-US',
				} );
			} );

			it( 'sets site-wide headers when provided an object of header name-value pairs', () => {
				site.setHeaders( {
					'Accept-Language': 'en-CA',
					Authorization: 'Bearer sometoken',
				} );
				expect( site._options ).toHaveProperty( 'headers' );
				expect( site._options.headers ).toEqual( {
					'Accept-Language': 'en-CA',
					Authorization: 'Bearer sometoken',
				} );
			} );

			it( 'passes headers to all subsequently-instantiated handlers', () => {
				site.setHeaders( {
					'Accept-Language': 'en-IL',
					Authorization: 'Bearer chicagostylepizza',
				} );
				const req = site.root( '' );
				expect( req ).toHaveProperty( '_options' );
				expect( typeof req._options ).toBe( 'object' );
				expect( req._options ).toHaveProperty( 'headers' );
				expect( req._options.headers ).toEqual( {
					'Accept-Language': 'en-IL',
					Authorization: 'Bearer chicagostylepizza',
				} );
			} );

		} );

		describe( '.registerRoute()', () => {

			it( 'is a function', () => {
				expect( site ).toHaveProperty( 'registerRoute' );
				expect( typeof site.registerRoute ).toBe( 'function' );
			} );

		} );

	} );

	describe( 'instance has endpoint accessors', () => {

		it( 'for the media endpoint', () => {
			expect( site ).toHaveProperty( 'media' );
			expect( typeof site.media ).toBe( 'function' );
		} );

		it( 'for the pages endpoint', () => {
			expect( site ).toHaveProperty( 'pages' );
			expect( typeof site.pages ).toBe( 'function' );
		} );

		it( 'for the posts endpoint', () => {
			expect( site ).toHaveProperty( 'posts' );
			expect( typeof site.posts ).toBe( 'function' );
		} );

		it( 'for the taxonomies endpoint', () => {
			expect( site ).toHaveProperty( 'taxonomies' );
			expect( typeof site.taxonomies ).toBe( 'function' );
		} );

		it( 'for the categories endpoint', () => {
			expect( site ).toHaveProperty( 'categories' );
			expect( typeof site.categories ).toBe( 'function' );
		} );

		it( 'for the tags endpoint', () => {
			expect( site ).toHaveProperty( 'tags' );
			expect( typeof site.tags ).toBe( 'function' );
		} );

		it( 'for the types endpoint', () => {
			expect( site ).toHaveProperty( 'types' );
			expect( typeof site.types ).toBe( 'function' );
		} );

		it( 'for the users endpoint', () => {
			expect( site ).toHaveProperty( 'users' );
			expect( typeof site.users ).toBe( 'function' );
		} );

	} );

} );
