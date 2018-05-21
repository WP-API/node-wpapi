'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
chai.use( require( 'sinon-chai' ) );
var expect = chai.expect;
var sinon = require( 'sinon' );

/*jshint -W079 */// Suppress warning about redefiniton of `Promise`
var Promise = require( 'es6-promise' ).Promise;

var WPAPI = require( '../../' );

// Constructors, for use with instanceof checks
var WPRequest = require( '../../lib/constructors/wp-request' );

// HTTP transport, for stubbing
var httpTransport = require( '../../lib/http-transport' );

describe( 'WPAPI', () => {

	var site;

	beforeEach( () => {
		site = new WPAPI({ endpoint: 'endpoint/url' });
	});

	describe( 'constructor', () => {

		it( 'enforces new', () => {
			var site1 = new WPAPI({ endpoint: '/' });
			expect( site1 instanceof WPAPI ).to.be.true;
			var site2 = WPAPI({ endpoint: '/' });
			expect( site2 instanceof WPAPI ).to.be.true;
		});

		it( 'throws an error if no endpoint is provided', () => {
			expect(function() {
				new WPAPI({ endpoint: '/' });
			}).not.to.throw();
			expect(function() {
				new WPAPI();
			}).to.throw();
		});

		it( 'throws an error if a non-string endpoint is provided', () => {
			expect(function() {
				new WPAPI({ endpoint: 42 });
			}).to.throw();
			expect(function() {
				new WPAPI({ endpoint: [] });
			}).to.throw();
			expect(function() {
				new WPAPI({ endpoint: { lob: 'ster' } });
			}).to.throw();
		});

		it( 'sets options on an instance variable', () => {
			var site = new WPAPI({
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky'
			});
			expect( site._options.endpoint ).to.equal( 'http://some.url.com/wp-json/' );
			expect( site._options.username ).to.equal( 'fyodor' );
			expect( site._options.password ).to.equal( 'dostoyevsky' );
		});

		it( 'activates authentication when credentials are provided', () => {
			var site = new WPAPI({
				endpoint: 'http://some.url.com/wp-json',
				username: 'fyodor',
				password: 'dostoyevsky'
			});
			expect( site._options.username ).to.equal( 'fyodor' );
			expect( site._options.password ).to.equal( 'dostoyevsky' );
			expect( site._options.auth ).to.be.true;
		});

		describe( 'assigns default HTTP transport', () => {

			it( 'for GET requests', () => {
				sinon.stub( httpTransport, 'get' );
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				var query = site.root( '' );
				query.get();
				expect( httpTransport.get ).to.have.been.calledWith( query );
				httpTransport.get.restore();
			});

			it( 'for POST requests', () => {
				sinon.stub( httpTransport, 'post' );
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				var query = site.root( '' );
				var data = {};
				query.create( data );
				expect( httpTransport.post ).to.have.been.calledWith( query, data );
				httpTransport.post.restore();
			});

			it( 'for POST requests', () => {
				sinon.stub( httpTransport, 'post' );
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				var query = site.root( '' );
				var data = {};
				query.create( data );
				expect( httpTransport.post ).to.have.been.calledWith( query, data );
				httpTransport.post.restore();
			});

			it( 'for PUT requests', () => {
				sinon.stub( httpTransport, 'put' );
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				var query = site.root( 'a-resource' );
				var data = {};
				query.update( data );
				expect( httpTransport.put ).to.have.been.calledWith( query, data );
				httpTransport.put.restore();
			});

			it( 'for DELETE requests', () => {
				sinon.stub( httpTransport, 'delete' );
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				var query = site.root( 'a-resource' );
				var data = {
					force: true
				};
				query.delete( data );
				expect( httpTransport.delete ).to.have.been.calledWith( query, data );
				httpTransport.delete.restore();
			});

		});

		describe( 'custom HTTP transport methods', () => {

			it( 'can be set for an individual HTTP action', () => {
				sinon.stub( httpTransport, 'get' );
				var customGet = sinon.stub();
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet
					}
				});
				var query = site.root( '' );
				query.get();
				expect( httpTransport.get ).not.to.have.been.called;
				expect( customGet ).to.have.been.calledWith( query );
				httpTransport.get.restore();
			});

			it( 'can extend the default HTTP transport methods', () => {
				sinon.stub( httpTransport, 'get' );
				var customGet = sinon.spy(function() {
					WPAPI.transport.get.apply( null, arguments );
				});
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet
					}
				});
				var query = site.root( '' );
				query.get();
				expect( customGet ).to.have.been.calledWith( query );
				expect( httpTransport.get ).to.have.been.calledWith( query );
				httpTransport.get.restore();
			});

			it( 'can be set for multiple HTTP actions', () => {
				sinon.stub( httpTransport, 'post' );
				sinon.stub( httpTransport, 'put' );
				var customPost = sinon.stub();
				var customPut = sinon.stub();
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						post: customPost,
						put: customPut
					}
				});
				var query = site.root( 'a-resource' );
				var data = {};
				query.create( data );
				expect( httpTransport.post ).not.to.have.been.called;
				expect( customPost ).to.have.been.calledWith( query, data );
				query.update( data );
				expect( httpTransport.put ).not.to.have.been.called;
				expect( customPut ).to.have.been.calledWith( query, data );
				httpTransport.post.restore();
				httpTransport.put.restore();
			});

			it( 'only apply to a specific WPAPI instance', () => {
				sinon.stub( httpTransport, 'get' );
				var customGet = sinon.stub();
				var site = new WPAPI({
					endpoint: 'http://some.url.com/wp-json',
					transport: {
						get: customGet
					}
				});
				var site2 = new WPAPI({
					endpoint: 'http://some.url.com/wp-json'
				});
				expect( site ).not.to.equal( site2 );
				var query = site2.root( '' );
				query.get();
				expect( httpTransport.get ).to.have.been.calledWith( query );
				expect( customGet ).not.to.have.been.called;
				httpTransport.get.restore();
			});

		});

	});

	describe( '.transport constructor property', () => {

		it( 'is defined', () => {
			expect( WPAPI ).to.have.property( 'transport' );
		});

		it( 'is an object', () => {
			expect( WPAPI.transport ).to.be.an( 'object' );
		});

		it( 'has methods for each http transport action', () => {
			expect( WPAPI.transport.delete ).to.be.a( 'function' );
			expect( WPAPI.transport.get ).to.be.a( 'function' );
			expect( WPAPI.transport.head ).to.be.a( 'function' );
			expect( WPAPI.transport.post ).to.be.a( 'function' );
			expect( WPAPI.transport.put ).to.be.a( 'function' );
		});

		it( 'is frozen (properties cannot be modified directly)', () => {
			expect(function() {
				WPAPI.transport.get = function() {};
			}).to.throw();
		});

	});

	describe( '.site() constructor method', () => {

		it( 'is a function', () => {
			expect( WPAPI ).to.have.property( 'site' );
			expect( WPAPI.site ).to.be.a( 'function' );
		});

		it( 'creates and returns a new WPAPI instance', () => {
			var site = WPAPI.site( 'endpoint/url' );
			expect( site instanceof WPAPI ).to.be.true;
			expect( site._options.endpoint ).to.equal( 'endpoint/url/' );
		});

		it( 'can take a routes configuration object to bootstrap the returned instance', () => {
			var site = WPAPI.site( 'endpoint/url', {
				'/wp/v2/posts': {
					namespace: 'wp/v2',
					methods: [ 'GET' ],
					endpoints: [ {
						methods: [ 'GET' ],
						args: {
							filter: {}
						}
					} ]
				}
			});
			expect( site instanceof WPAPI ).to.be.true;
			expect( site.posts ).to.be.a( 'function' );
			expect( site ).not.to.have.property( 'comments' );
			expect( site.posts() ).not.to.have.property( 'id' );
			expect( site.posts().filter ).to.be.a( 'function' );
			expect( site.posts().toString() ).to.equal( 'endpoint/url/wp/v2/posts' );
		});

	});

	describe( '.discover() constructor method', () => {
		var responses;
		var sinonSandbox;

		beforeEach( () => {
			responses = {
				head: {},
				get: {}
			};
			responses.head.withLink = {
				'content-type': 'text/html; charset=UTF-8',
				link: '<http://mozarts.house/wp-json/>; rel="https://api.w.org/"'
			};
			responses.head.withoutLink = {
				'content-type': 'text/html; charset=utf-8'
			};
			responses.get.withLink = {
				headers: {
					'content-type': 'text/html; charset=UTF-8',
					link: '<http://mozarts.house/wp-json/>; rel="https://api.w.org/"'
				}
			};
			responses.get.withoutLink = {
				headers: {
					'content-type': 'text/html; charset=UTF-8'
				}
			};
			responses.apiRoot = {
				name: 'Skip Beats',
				descrition: 'Just another WordPress weblog',
				routes: {
					'list': {},
					'of': {},
					'routes': {}
				}
			};
			// Stub HTTP methods
			sinon.stub( httpTransport, 'head' );
			sinon.stub( httpTransport, 'get' );
			// Stub warn and error
			sinonSandbox = sinon.sandbox.create();
			sinonSandbox.stub( global.console, 'warn' );
			sinonSandbox.stub( global.console, 'error' );
		});

		afterEach(function() {
			// Restore HTTP methods
			httpTransport.head.restore();
			httpTransport.get.restore();
			// Restore sandbox
			sinonSandbox.restore();
		});

		it( 'is a function', () => {
			expect( WPAPI ).to.have.property( 'discover' );
			expect( WPAPI.discover ).to.be.a( 'function' );
		});

		it( 'throws an error if no API endpoint can be discovered', () => {
			var url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.onFirstCall().returns( Promise.reject() );
			httpTransport.get.onFirstCall().returns( Promise.reject( 'Some error' ) );
			var prom = WPAPI.discover( url )
				.catch(function( err ) {
					expect( global.console.error ).to.have.been.calledWith( 'Some error' );
					expect( err.message ).to.equal( 'Autodiscovery failed' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'discovers the API root with a HEAD request', () => {
			var url = 'http://mozarts.house';
			httpTransport.head.returns( Promise.resolve( responses.head.withLink ) );
			httpTransport.get.returns( Promise.resolve( responses.apiRoot ) );
			var prom = WPAPI.discover( url )
				.then(function( result ) {
					expect( result ).to.be.an.instanceOf( WPAPI );
					expect( httpTransport.head.calledOnce ).to.equal( true );
					expect( httpTransport.get.calledOnce ).to.equal( true );
					expect( result.root().toString() ).to.equal( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'throws an error if HEAD succeeds but no link is present', () => {
			var url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.onFirstCall().returns( Promise.resolve( responses.head.withoutLink ) );
			var prom = WPAPI.discover( url )
				.catch(function( err ) {
					expect( global.console.error ).to.have.been
						.calledWith( new Error( 'No header link found with rel="https://api.w.org/"' ) );
					expect( err.message ).to.equal( 'Autodiscovery failed' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'retries the initial site request as a GET if HEAD fails', () => {
			var url = 'http://mozarts.house';
			httpTransport.head.returns( Promise.reject() );
			httpTransport.get.onFirstCall().returns( Promise.resolve( responses.get.withLink ) );
			httpTransport.get.onSecondCall().returns( Promise.resolve( responses.apiRoot ) );
			var prom = WPAPI.discover( url )
				.then(function( result ) {
					expect( result ).to.be.an.instanceOf( WPAPI );
					expect( httpTransport.head.calledOnce ).to.equal( true );
					expect( httpTransport.get.calledTwice ).to.equal( true );
					expect( result.root().toString() ).to.equal( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'throws an error if GET retry succeeds but no link is present', () => {
			var url = 'http://we.made.it/to/mozarts/house';
			httpTransport.head.returns( Promise.reject() );
			httpTransport.get.onFirstCall().returns( Promise.resolve( responses.get.withoutLink ) );
			var prom = WPAPI.discover( url )
				.catch(function( err ) {
					expect( global.console.error ).to.have.been
						.calledWith( new Error( 'No header link found with rel="https://api.w.org/"' ) );
					expect( err.message ).to.equal( 'Autodiscovery failed' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'returns WPAPI instance bound to discovered root even when route request errors', () => {
			var url = 'http://mozarts.house';
			httpTransport.head.returns( Promise.reject() );
			httpTransport.get.onFirstCall().returns( Promise.resolve( responses.get.withLink ) );
			httpTransport.get.onSecondCall().returns( Promise.reject( 'Some error' ) );
			var prom = WPAPI.discover( url )
				.then(function( result ) {
					expect( result ).to.be.an.instanceOf( WPAPI );
					expect( httpTransport.head.calledOnce ).to.equal( true );
					expect( httpTransport.get.calledTwice ).to.equal( true );
					expect( global.console.error ).to.have.been.calledWith( 'Some error' );
					expect( global.console.warn ).to.have.been.calledWith( 'Endpoint detected, proceeding despite error...' );
					expect( result.root().toString() ).to.equal( 'http://mozarts.house/wp-json/' );
					return SUCCESS;
				});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

	describe( '.prototype', () => {

		describe( '.namespace()', () => {

			it( 'is a function', () => {
				expect( site ).to.have.property( 'namespace' );
				expect( site.namespace ).to.be.a( 'function' );
			});

			it( 'returns a namespace object with relevant endpoint handler methods', () => {
				var wpV2 = site.namespace( 'wp/v2' );
				// Spot check
				expect( wpV2 ).to.be.an( 'object' );
				expect( wpV2 ).to.have.property( 'posts' );
				expect( wpV2.posts ).to.be.a( 'function' );
				expect( wpV2 ).to.have.property( 'comments' );
				expect( wpV2.comments ).to.be.a( 'function' );
			});

			it( 'passes options from the parent WPAPI instance to the namespaced handlers', () => {
				site.auth({
					username: 'u',
					password: 'p'
				});
				var pages = site.namespace( 'wp/v2' ).pages();
				expect( pages._options ).to.be.an( 'object' );
				expect( pages._options ).to.have.property( 'username' );
				expect( pages._options.username ).to.equal( 'u' );
				expect( pages._options ).to.have.property( 'password' );
				expect( pages._options.password ).to.equal( 'p' );
			});

			it( 'permits the namespace to be stored in a variable without disrupting options', () => {
				site.auth({
					username: 'u',
					password: 'p'
				});
				var wpV2 = site.namespace( 'wp/v2' );
				var pages = wpV2.pages();
				expect( pages._options ).to.be.an( 'object' );
				expect( pages._options ).to.have.property( 'username' );
				expect( pages._options.username ).to.equal( 'u' );
				expect( pages._options ).to.have.property( 'password' );
				expect( pages._options.password ).to.equal( 'p' );
			});

			it( 'throws an error when provided no namespace', () => {
				expect(function() {
					site.namespace();
				}).to.throw();
			});

			it( 'throws an error when provided an unregistered namespace', () => {
				expect(function() {
					site.namespace( 'foo/baz' );
				}).to.throw();
			});

		});

		describe( '.bootstrap()', () => {

			beforeEach( () => {
				site.bootstrap({
					'/myplugin/v1/authors/(?P<name>[\\w-]+)': {
						namespace: 'myplugin/v1',
						methods: [ 'GET', 'POST' ],
						endpoints: [ {
							methods: [ 'GET' ],
							args: {
								name: {}
							}
						} ]
					},
					'/wp/v2/customendpoint/(?P<thing>[\\w-]+)': {
						namespace: 'wp/v2',
						methods: [ 'GET', 'POST' ],
						endpoints: [ {
							methods: [ 'GET' ],
							args: {
								parent: {}
							}
						} ]
					}
				});
			});

			it( 'is a function', () => {
				expect( site ).to.have.property( 'bootstrap' );
				expect( site.bootstrap ).to.be.a( 'function' );
			});

			it( 'is chainable', () => {
				expect( site.bootstrap() ).to.equal( site );
			});

			it( 'creates handlers for all provided route definitions', () => {
				expect( site.namespace( 'myplugin/v1' ) ).to.be.an( 'object' );
				expect( site.namespace( 'myplugin/v1' ) ).to.have.property( 'authors' );
				expect( site.namespace( 'myplugin/v1' ).authors ).to.be.a( 'function' );
				expect( site.namespace( 'wp/v2' ) ).to.be.an( 'object' );
				expect( site.namespace( 'wp/v2' ) ).to.have.property( 'customendpoint' );
				expect( site.namespace( 'wp/v2' ).customendpoint ).to.be.a( 'function' );
			});

			it( 'properly assigns setter methods for detected path parts', () => {
				var thingHandler = site.customendpoint();
				expect( thingHandler ).to.have.property( 'thing' );
				expect( thingHandler.thing ).to.be.a( 'function' );
				expect( thingHandler.thing( 'foobar' ).toString() ).to.equal( 'endpoint/url/wp/v2/customendpoint/foobar' );
			});

			it( 'assigns any mixins for detected GET arguments for custom namespace handlers', () => {
				var authorsHandler = site.namespace( 'myplugin/v1' ).authors();
				expect( authorsHandler ).to.have.property( 'name' );
				expect( authorsHandler ).not.to.have.ownProperty( 'name' );
				expect( authorsHandler.name ).to.be.a( 'function' );
				var customEndpoint = site.customendpoint();
				expect( customEndpoint ).to.have.property( 'parent' );
				expect( customEndpoint ).not.to.have.ownProperty( 'parent' );
				expect( customEndpoint.parent ).to.be.a( 'function' );
			});

			it( 'assigns handlers for wp/v2 routes to the instance object itself', () => {
				expect( site ).to.have.property( 'customendpoint' );
				expect( site.customendpoint ).to.be.a( 'function' );
				expect( site.namespace( 'wp/v2' ).customendpoint ).to.equal( site.customendpoint );
			});

		});

		describe( '.transport()', () => {

			it( 'is defined', () => {
				expect( site ).to.have.property( 'transport' );
			});

			it( 'is a function', () => {
				expect( site.transport ).to.be.a( 'function' );
			});

			it( 'is chainable', () => {
				expect( site.transport() ).to.equal( site );
			});

			it( 'sets transport methods on the instance', () => {
				sinon.stub( httpTransport, 'get' );
				var customGet = sinon.stub();
				site.transport({
					get: customGet
				});
				function cb() {}
				var query = site.root( '' );
				query.get( cb );
				expect( httpTransport.get ).not.to.have.been.called;
				expect( customGet ).to.have.been.calledWith( query, cb );
				httpTransport.get.restore();
			});

			it( 'does not impact or overwrite unspecified transport methods', () => {
				var originalMethods = Object.assign( {}, site._options.transport );
				site.transport({
					get: function() {},
					put: function() {}
				});
				var newMethods = Object.assign( {}, site._options.transport );
				expect( newMethods.delete ).to.equal( originalMethods.delete );
				expect( newMethods.post ).to.equal( originalMethods.post );

				expect( newMethods.get ).not.to.equal( originalMethods.get );
				expect( newMethods.put ).not.to.equal( originalMethods.put );
			});

		});

		describe( '.url()', () => {

			it( 'is defined', () => {
				expect( site ).to.have.property( 'url' );
				expect( site.url ).to.be.a( 'function' );
			});

			it( 'creates a basic WPRequest object bound to the provided URL', () => {
				var request = site.url( 'http://some.arbitrary.url' );
				expect( request instanceof WPRequest ).to.be.true;
				expect( request._options.endpoint ).to.equal( 'http://some.arbitrary.url' );
			});

			it( 'maps requests directly onto the provided URL', () => {
				var request = site.url( 'http://some.url.com/wp-json?filter[name]=some-slug' );
				var path = request.toString();
				expect( path ).to.equal( 'http://some.url.com/wp-json?filter[name]=some-slug' );
			});

			it( 'inherits whitelisted non-endpoint options from the parent WPAPI instance', () => {
				var site = new WPAPI({
					endpoint: 'http://website.com/',
					identifier: 'some unique value'
				});
				var request = site.url( 'http://new-endpoint.com/' );
				expect( request._options ).to.have.property( 'endpoint' );
				expect( request._options.endpoint ).to.equal( 'http://new-endpoint.com/' );
				expect( request._options ).not.to.have.property( 'identifier' );
			});

		});

		describe( '.root()', () => {

			beforeEach( () => {
				site = new WPAPI({ endpoint: 'http://my.site.com/wp-json' });
			});

			it( 'is defined', () => {
				expect( site ).to.have.property( 'root' );
				expect( site.root ).to.be.a( 'function' );
			});

			it( 'creates a get request against the root endpoint', () => {
				var request = site.root();
				expect( request.toString() ).to.equal( 'http://my.site.com/wp-json/' );
			});

			it( 'takes a "path" argument to query a root-relative path', () => {
				var request = site.root( 'custom/endpoint' );
				expect( request.toString() ).to.equal( 'http://my.site.com/wp-json/custom/endpoint' );
			});

			it( 'creates a WPRequest object', () => {
				var pathRequest = site.root( 'some/collection/endpoint' );
				expect( pathRequest instanceof WPRequest ).to.be.true;
			});

			it( 'inherits options from the parent WPAPI instance', () => {
				var site = new WPAPI({
					endpoint: 'http://cat.website.com/'
				});
				var request = site.root( 'custom-path' );
				expect( request._options ).to.have.property( 'endpoint' );
				expect( request._options.endpoint ).to.equal( 'http://cat.website.com/' );
			});

		});

		describe( '.auth()', () => {

			beforeEach( () => {
				site = new WPAPI({ endpoint: 'http://my.site.com/wp-json' });
			});

			it( 'is defined', () => {
				expect( site ).to.have.property( 'auth' );
				expect( site.auth ).to.be.a( 'function' );
			});

			it( 'activates authentication for the site', () => {
				expect( site._options ).not.to.have.property( 'auth' );
				site.auth();
				expect( site._options ).to.have.property( 'auth' );
				expect( site._options.auth ).to.be.true;
			});

			it( 'sets the username and password when provided in an object', () => {
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

			it( 'can update previously-set usernames and passwords', () => {
				site.auth({
					username: 'user1',
					password: 'pass1'
				}).auth({
					username: 'admin',
					password: 'sandwich'
				});
				expect( site._options ).to.have.property( 'username' );
				expect( site._options ).to.have.property( 'password' );
				expect( site._options.username ).to.equal( 'admin' );
				expect( site._options.password ).to.equal( 'sandwich' );
				expect( site._options ).to.have.property( 'auth' );
				expect( site._options.auth ).to.be.true;
			});

			it( 'sets the nonce when provided in an object', () => {
				site.auth({
					nonce: 'somenonce'
				});
				expect( site._options ).to.have.property( 'nonce' );
				expect( site._options.nonce ).to.equal( 'somenonce' );
				expect( site._options ).to.have.property( 'auth' );
				expect( site._options.auth ).to.be.true;
			});

			it( 'can update nonce credentials', () => {
				site.auth({
					nonce: 'somenonce'
				}).auth({
					nonce: 'refreshednonce'
				});
				expect( site._options ).to.have.property( 'nonce' );
				expect( site._options.nonce ).to.equal( 'refreshednonce' );
				expect( site._options ).to.have.property( 'auth' );
				expect( site._options.auth ).to.be.true;
			});

			it( 'passes authentication status to all subsequently-instantiated handlers', () => {
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

		});

		describe( '.setHeaders()', () => {

			beforeEach( () => {
				site = new WPAPI({ endpoint: 'http://my.site.com/wp-json' });
			});

			it( 'is defined', () => {
				expect( site ).to.have.property( 'setHeaders' );
				expect( site.setHeaders ).to.be.a( 'function' );
			});

			it( 'initializes site-wide headers object if called with no arguments', () => {
				expect( site._options ).not.to.have.property( 'headers' );
				site.setHeaders();
				expect( site._options ).to.have.property( 'headers' );
				expect( site._options.headers ).to.deep.equal({});
			});

			it( 'sets site-wide headers when provided a name-value pair', () => {
				site.setHeaders( 'Accept-Language', 'en-US' );
				expect( site._options ).to.have.property( 'headers' );
				expect( site._options.headers ).to.deep.equal({
					'Accept-Language': 'en-US'
				});
			});

			it( 'sets site-wide headers when provided an object of header name-value pairs', () => {
				site.setHeaders({
					'Accept-Language': 'en-CA',
					Authorization: 'Bearer sometoken'
				});
				expect( site._options ).to.have.property( 'headers' );
				expect( site._options.headers ).to.deep.equal({
					'Accept-Language': 'en-CA',
					Authorization: 'Bearer sometoken'
				});
			});

			it( 'passes headers to all subsequently-instantiated handlers', () => {
				site.setHeaders({
					'Accept-Language': 'en-IL',
					Authorization: 'Bearer chicagostylepizza'
				});
				var req = site.root( '' );
				expect( req ).to.have.property( '_options' );
				expect( req._options ).to.be.an( 'object' );
				expect( req._options ).to.have.property( 'headers' );
				expect( req._options.headers ).to.deep.equal({
					'Accept-Language': 'en-IL',
					Authorization: 'Bearer chicagostylepizza'
				});
			});

		});

		describe( '.registerRoute()', () => {

			it( 'is a function', () => {
				expect( site ).to.have.property( 'registerRoute' );
				expect( site.registerRoute ).to.be.a( 'function' );
			});

		});

	});

	describe( 'instance has endpoint accessors', () => {

		it( 'for the media endpoint', () => {
			expect( site ).to.have.property( 'media' );
			expect( site.media ).to.be.a( 'function' );
		});

		it( 'for the pages endpoint', () => {
			expect( site ).to.have.property( 'pages' );
			expect( site.pages ).to.be.a( 'function' );
		});

		it( 'for the posts endpoint', () => {
			expect( site ).to.have.property( 'posts' );
			expect( site.posts ).to.be.a( 'function' );
		});

		it( 'for the taxonomies endpoint', () => {
			expect( site ).to.have.property( 'taxonomies' );
			expect( site.taxonomies ).to.be.a( 'function' );
		});

		it( 'for the categories endpoint', () => {
			expect( site ).to.have.property( 'categories' );
			expect( site.categories ).to.be.a( 'function' );
		});

		it( 'for the tags endpoint', () => {
			expect( site ).to.have.property( 'tags' );
			expect( site.tags ).to.be.a( 'function' );
		});

		it( 'for the types endpoint', () => {
			expect( site ).to.have.property( 'types' );
			expect( site.types ).to.be.a( 'function' );
		});

		it( 'for the users endpoint', () => {
			expect( site ).to.have.property( 'users' );
			expect( site.users ).to.be.a( 'function' );
		});

	});

});
