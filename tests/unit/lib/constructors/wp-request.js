'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
chai.use( require( 'sinon-chai' ) );
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var WPRequest = require( '../../../../lib/constructors/wp-request' );
var filterMixins = require( '../../../../lib/mixins/filters' );

describe( 'WPRequest', function() {

	var request;

	beforeEach(function() {
		request = new WPRequest();
	});

	describe( 'constructor', function() {

		it( 'should create a WPRequest instance', function() {
			expect( request instanceof WPRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			request = new WPRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( request._options.booleanProp ).to.be.true;
			expect( request._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should define a _supportedMethods array', function() {
			var _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|post|put' );
		});

	});

	describe( '_renderQuery()', function() {

		beforeEach(function() {
			Object.keys( filterMixins ).forEach(function( mixin ) {
				if ( ! request[ mixin ] ) {
					request[ mixin ] = filterMixins[ mixin ];
				}
			});
		});

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

		it( 'properly parses array filters', function() {
			request._filters = { post__in: [ 0, 1 ] };
			var query = request._renderQuery();
			expect( query ).to
				.equal( '?filter%5Bpost__in%5D%5B%5D=0&filter%5Bpost__in%5D%5B%5D=1' );
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

	describe( '_checkMethodSupport', function() {

		it( 'should return true when called with a supported method', function() {
			expect( request._checkMethodSupport( 'get' ) ).to.equal( true );
		});

		it( 'should throw an error when called with an unsupported method', function() {
			request._supportedMethods = [ 'get' ];

			expect(function() {
				return request._checkMethodSupport( 'post' );
			}).to.throw();
		});

	});

	describe( 'namespace', function() {

		it( 'is defined', function() {
			expect( request ).to.have.property( 'namespace' );
			expect( request.namespace ).to.be.a( 'function' );
		});

		it( 'sets a value that is prepended to the path', function() {
			request.namespace( 'ns' );
			expect( request._renderPath() ).to.equal( 'ns' );
		});

		it( 'can accept & set a namespace in the (:domain/:version) format', function() {
			request.namespace( 'ns/v3' );
			expect( request._renderPath() ).to.equal( 'ns/v3' );
		});

		it( 'can be removed (to use the legacy api v1) with an empty string', function() {
			request.namespace( 'windows/xp' ).namespace( '' );
			expect( request._renderPath() ).to.equal( '' );
		});

		it( 'can be removed (to use the legacy api v1) by omitting arguments', function() {
			request.namespace( 'wordpress/95' ).namespace();
			expect( request._renderPath() ).to.equal( '' );
		});

	});

	describe( 'param()', function() {

		it( 'method exists', function() {
			expect( request ).to.have.property( 'param' );
			expect( request.param ).to.be.a( 'function' );
		});

		it( 'will have no effect if called without any arguments', function() {
			request.param();
			expect( request._renderQuery() ).to.equal( '' );
		});

		it( 'will set a query parameter value', function() {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
		});

		it( 'will unset a query parameter value if called with empty string', function() {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', '' );
			expect( request._renderQuery() ).to.equal( '' );
		});

		it( 'will unset a query parameter value if called with null', function() {
			request.param( 'key', 'value' );
			expect( request._renderQuery() ).to.equal( '?key=value' );
			request.param( 'key', 'value' );
			request.param( 'key', null );
			expect( request._renderQuery() ).to.equal( '' );
		});

		it( 'will have no effect if called with no value', function() {
			request.param( 'key' );
			expect( request._renderQuery() ).to.equal( '' );
		});

		it( 'will have no effect if called with an empty object', function() {
			request.param({});
			expect( request._renderQuery() ).to.equal( '' );
		});

		it( 'should set the internal _params hash', function() {
			request.param( 'type', 'some_cpt' );
			expect( request._renderQuery() ).to.equal( '?type=some_cpt' );
			request.param( 'context', 'edit' );
			expect( request._renderQuery() ).to.equal( '?context=edit&type=some_cpt' );
		});

		it( 'should set parameters by passing a hash object', function() {
			request.param({
				page: 309,
				context: 'view'
			});
			expect( request._renderQuery() ).to.equal( '?context=view&page=309' );
		});

		it( 'should merge provided values if merge is set to true', function() {
			request.param( 'type', 'post' );
			request.param( 'type', 'page', true );
			expect( request._params.type ).to.deep.equal( [ 'page', 'post' ] );
		});

		it( 'should merge, de-dupe & sort array values', function() {
			request.param( 'type', [ 'post', 'page', 'post' ] );
			expect( request._renderQuery() ).to.equal( '?type%5B%5D=page&type%5B%5D=post' );
			request.param( 'type', [ 'page', 'cpt_item' ], true );
			expect( request._renderQuery() ).to.equal( '?type%5B%5D=cpt_item&type%5B%5D=page&type%5B%5D=post' );
		});

	});

	describe( 'parameter convenience methods', function() {

		describe( 'context', function() {

			beforeEach(function() {
				request = new WPRequest({
					endpoint: '/'
				});
			});

			it( 'should be defined', function() {
				expect( request ).to.have.property( 'context' );
				expect( request.context ).to.be.a( 'function' );
			});

			it( 'wraps .param()', function() {
				sinon.stub( request, 'param' );
				request.context( 'view' );
				expect( request.param ).to.have.been.calledWith( 'context', 'view' );
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

		describe( 'embed()', function() {

			it( 'should be a function', function() {
				expect( request ).to.have.property( 'embed' );
				expect( request.embed ).to.be.a( 'function' );
			});

			it( 'should set the "_embed" parameter', function() {
				request.embed();
				expect( request._params._embed ).to.equal( true );
			});

			it( 'should be chainable', function() {
				expect( request.embed() ).to.equal( request );
			});

		});

	});

	describe( 'auth', function() {

		it( 'is defined', function() {
			expect( request ).to.have.property( 'auth' );
			expect( request.auth ).to.be.a( 'function' );
		});

		it( 'sets the "auth" option to "true"', function() {
			expect( request._options ).not.to.have.property( 'auth' );
			request.auth();
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		});

		it( 'sets the username and password when provided as strings', function() {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth( 'user', 'pass' );
			expect( request._options ).to.have.property( 'username' );
			expect( request._options ).to.have.property( 'password' );
			expect( request._options.username ).to.equal( 'user' );
			expect( request._options.password ).to.equal( 'pass' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		});

		it( 'sets the username and password when provided in an object', function() {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth({
				username: 'user',
				password: 'pass'
			});
			expect( request._options ).to.have.property( 'username' );
			expect( request._options ).to.have.property( 'password' );
			expect( request._options.username ).to.equal( 'user' );
			expect( request._options.password ).to.equal( 'pass' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		});

		it( 'does not set username/password if they are not provided as string values', function() {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth({
				username: 123,
				password: false
			});
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			expect( request._options ).to.have.property( 'auth' );
			expect( request._options.auth ).to.be.true;
		});

	}); // auth

	describe( '._auth', function() {

		var mockAgent;

		beforeEach(function() {
			mockAgent = {
				auth: sinon.stub(),
				set: sinon.stub()
			};
		});

		it( 'should set a header on the request if a nonce is provided', function() {
			request._options = {
				nonce: 'testnonce'
			};
			request._auth( mockAgent );
			expect( mockAgent.set ).to.have.been.calledWith( 'X-WP-Nonce', 'testnonce' );
		});

		it( 'should set basic auth on the provided request if auth is forced', function() {
			request._options = {
				username: 'usr',
				password: 'pwd'
			};
			request._auth( mockAgent, true );
			expect( mockAgent.auth ).to.have.been.calledWith( 'usr', 'pwd' );
		});

		it( 'should set auth on the provided request if the "auth" option is true', function() {
			request._options = {
				username: 'usr',
				password: 'pwd',
				auth: true
			};
			request._auth( mockAgent );
			expect( mockAgent.auth ).to.have.been.calledWith( 'usr', 'pwd' );
		});

		it( 'should not set auth if username is not available', function() {
			request._options = {
				password: 'pwd'
			};
			request._auth( mockAgent, true );
			expect( mockAgent.auth ).not.to.have.been.called;
		});

		it( 'should not set auth if password is not available', function() {
			request._options = {
				username: 'usr'
			};
			request._auth( mockAgent, true );
			expect( mockAgent.auth ).not.to.have.been.called;
		});

		it( 'should not set auth if auth is not true, and not forced', function() {
			request._options = {
				username: 'usr',
				password: 'pwd'
			};
			request._auth( mockAgent );
			expect( mockAgent.auth ).not.to.have.been.called;
		});

	}); // ._auth

	// Skipping tests until (a) the lodash v. sandboxed-module conflict can be
	// diagnosed and resolved, and/or (b) these tests can be modified so that
	// they test the external interface: right now we are testing our integration
	// with superagent, not whether the request methods _really_ do the right
	// thing. The integration suite that runs against wpapi-vagrant-varietal is
	// a good stop-gap for now, but we should consider using Nock (or similar)
	// to test this functionality.
	describe.skip( 'request methods', function() {

		var MockAgent = require( '../../mocks/mock-superagent' );
		var mockAgent;
		var SandboxedRequest;
		var wpRequest;

		beforeEach(function() {
			mockAgent = new MockAgent();
			SandboxedRequest = sandbox.require( '../../../../lib/constructors/wp-request', {
				requires: {
					'superagent': mockAgent
				}
			});
			wpRequest = new SandboxedRequest({
				endpoint: 'url/'
			});
		});

		describe( '.get()', function() {

			it( 'should trigger an HTTP GET request', function() {
				sinon.spy( mockAgent, 'get' );
				sinon.stub( mockAgent, 'end' );

				wpRequest.get();

				expect( mockAgent.get ).to.have.been.calledOnce;
				expect( mockAgent.get ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.end ).to.have.been.calledOnce;
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				mockAgent._response = { body: 'data', headers: {} };

				return wpRequest.get( spy ).then( function() {
					expect( spy ).to.have.been.calledOnce;
					expect( spy ).to.have.been.calledWith( null, 'data' );
				});
			});

			it( 'should return a Promise to the request data', function() {
				mockAgent._response = { body: 'data', headers: {} };
				var promise = wpRequest.get();
				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );
				return promise.then(function( data ) {
					expect( data ).to.equal( 'data' );
				});
			});

		}); // .get()

		describe( '.then()', function() {

			it( 'should invoke GET and pass the results to the provided callback', function() {
				mockAgent._response = { body: 'data', headers: {} };
				var get = sinon.spy( wpRequest, 'get' );
				var success = sinon.stub();
				var failure = sinon.stub();
				var promise = wpRequest.then( success, failure );

				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );

				return promise.then(function() {
					expect( get ).to.have.been.calledWith();
					expect( success ).to.have.been.calledWith( 'data' );
					expect( failure ).not.to.have.been.called;
				});
			});

			it( 'should call the failure callback if GET fails', function() {
				mockAgent._err = 'Something went wrong';
				var success = sinon.stub();
				var failure = sinon.stub();
				var promise = wpRequest.then( success, failure );

				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );

				return promise.then(function() {
					expect( failure ).to.have.been.calledWith( 'Something went wrong' );
					expect( success ).not.to.have.been.called;
				});
			});

		}); // .then()

		describe( '.post()', function() {

			it( 'should trigger an HTTP POST request', function() {
				sinon.spy( mockAgent, 'post' );
				sinon.spy( mockAgent, 'auth' );
				sinon.spy( mockAgent, 'send' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';
				var data = { some: 'data' };

				wpRequest.post( data );

				expect( mockAgent.post ).to.have.been.calledOnce;
				expect( mockAgent.post ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.auth ).to.have.been.calledOnce;
				expect( mockAgent.auth ).to.have.been.calledWith( 'user', 'pass' );
				expect( mockAgent.send ).to.have.been.calledOnce;
				expect( mockAgent.send ).to.have.been.calledWith( data );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				var data = { some: 'data' };
				mockAgent._response = { body: 'some data', headers: {} };

				return wpRequest.post( data, spy ).then( function() {
					expect( spy ).to.have.been.calledOnce;
					expect( spy ).to.have.been.calledWith( null, 'some data' );
				});
			});

			it( 'should return a Promise to the request response', function() {
				mockAgent._response = { body: 'resp', headers: {} };
				var data = { some: 'data' };
				var promise = wpRequest.post( data );
				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );
				return promise.then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		}); // .post()

		describe( '.put()', function() {

			it( 'should trigger an HTTP PUT request', function() {
				sinon.spy( mockAgent, 'put' );
				sinon.spy( mockAgent, 'auth' );
				sinon.spy( mockAgent, 'send' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';
				var data = { some: 'data' };

				wpRequest.put( data );

				expect( mockAgent.put ).to.have.been.calledOnce;
				expect( mockAgent.put ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.auth ).to.have.been.calledOnce;
				expect( mockAgent.auth ).to.have.been.calledWith( 'user', 'pass' );
				expect( mockAgent.send ).to.have.been.calledOnce;
				expect( mockAgent.send ).to.have.been.calledWith( data );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				var data = { some: 'data' };
				mockAgent._response = { body: 'some data', headers: {} };

				return wpRequest.put( data, spy ).then( function() {
					expect( spy ).to.have.been.calledOnce;
					expect( spy ).to.have.been.calledWith( null, 'some data' );
				});
			});

			it( 'should return a Promise to the request data', function() {
				mockAgent._response = { body: 'resp', headers: {} };
				var data = { some: 'data' };
				var promise = wpRequest.put( data );
				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );
				return promise.then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		}); // .put()

		describe( '.delete()', function() {

			it( 'should trigger an HTTP DELETE request', function() {
				sinon.spy( mockAgent, 'del' );
				sinon.spy( mockAgent, 'auth' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';

				wpRequest.delete();

				expect( mockAgent.del ).to.have.been.calledOnce;
				expect( mockAgent.del ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.auth ).to.have.been.calledOnce;
				expect( mockAgent.auth ).to.have.been.calledWith( 'user', 'pass' );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				mockAgent._response = { body: 'some data', headers: {} };

				return wpRequest.delete( spy ).then( function() {
					expect( spy ).to.have.been.calledOnce;
					expect( spy ).to.have.been.calledWith( null, 'some data' );
				});
			});

			it( 'should pass through a provided data object', function() {
				sinon.spy( mockAgent, 'del' );
				sinon.spy( mockAgent, 'auth' );
				sinon.spy( mockAgent, 'send' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';
				var options = { force: true };

				wpRequest.delete( options );

				expect( mockAgent.del ).to.have.been.calledOnce;
				expect( mockAgent.del ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.auth ).to.have.been.calledOnce;
				expect( mockAgent.auth ).to.have.been.calledWith( 'user', 'pass' );
				expect( mockAgent.send ).to.have.been.calledOnce;
				expect( mockAgent.send ).to.have.been.calledWith( options );
			});

			it( 'should return a Promise to the body of the request data', function() {
				mockAgent._response = { body: 'resp', headers: {} };
				var promise = wpRequest.delete();
				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );
				return promise.then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		}); // .delete()

		describe( '.head()', function() {

			it( 'should trigger an HTTP HEAD request', function() {
				sinon.spy( mockAgent, 'head' );
				sinon.stub( mockAgent, 'end' );

				wpRequest.head();

				expect( mockAgent.head ).to.have.been.calledOnce;
				expect( mockAgent.head ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.end ).to.have.been.calledOnce;
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				mockAgent._response = { headers: 'some headers' };

				return wpRequest.head( spy ).then(function() {
					expect( spy ).to.have.been.calledOnce;
					expect( spy ).to.have.been.calledWith( null, 'some headers' );
				});
			});

			it( 'should return a Promise to the headers from the response', function() {
				mockAgent._response = { headers: 'resp' };
				var promise = wpRequest.head();
				expect( promise ).to.have.property( 'then' );
				expect( promise.then ).to.be.a( 'function' );
				return promise.then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		}); // .head()

		describe( 'pagination', function() {

			beforeEach(function() {
				wpRequest = new SandboxedRequest({
					endpoint: 'http://site.com/wp-json'
				});
			});

			it( 'passes data through unchanged if no headers are present', function() {
				mockAgent._response = {
					body: 'some object'
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.equal( 'some object' );
					expect( parsedResult ).not.to.have.property( '_paging' );
				});
			});

			it( 'sets pagination properties if headers include paging counts without links', function() {
				mockAgent._response = {
					headers: {
						'x-wp-totalpages': 1,
						'x-wp-total': 5
					},
					body: {}
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.have.property( '_paging' );
					expect( parsedResult._paging ).not.to.have.property( 'next' );
					expect( parsedResult._paging ).not.to.have.property( 'prev' );
					expect( parsedResult._paging ).to.have.property( 'total' );
					expect( parsedResult._paging.total ).to.equal( 5 );
					expect( parsedResult._paging ).to.have.property( 'totalPages' );
					expect( parsedResult._paging.totalPages ).to.equal( 1 );
				});
			});

			it( 'passes data through unchanged if pagination header is unset or empty', function() {
				mockAgent._response = {
					headers: { link: '' },
					body: 'some object'
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.equal( 'some object' );
					expect( parsedResult ).not.to.have.property( '_paging' );
				});
			});

			it( 'parses link headers', function() {
				mockAgent._response = {
					headers: {
						'x-wp-totalpages': 4,
						'x-wp-total': 7,
						link: [
							'</wp-json/wp/v2/posts?page=1>; rel="prev",',
							'</wp-json/wp/v2/posts?page=2>; rel="next",',
							'<http://site.com/wp-json/wp/v2/posts/1024>; rel="item";',
							'title="Article Title",',
							'<http://site.com/wp-json/wp/v2/posts/994>; rel="item";',
							'title="Another Article"'
						].join( ' ' )
					},
					body: {}
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.have.property( '_paging' );
					expect( parsedResult._paging ).to.have.property( 'links' );
					expect( parsedResult._paging.links ).to.have.property( 'prev' );
					var expectedPrevLink = '/wp-json/wp/v2/posts?page=1';
					expect( parsedResult._paging.links.prev ).to.equal( expectedPrevLink );
					expect( parsedResult._paging.links ).to.have.property( 'next' );
					var expectedNextLink = '/wp-json/wp/v2/posts?page=2';
					expect( parsedResult._paging.links.next ).to.equal( expectedNextLink );
				});
			});

			describe( '.next object', function() {

				beforeEach(function() {
					mockAgent._response = {
						headers: {
							'x-wp-totalpages': 4,
							'x-wp-total': 7,
							link: '</wp-json/wp/v2/posts?page=3>; rel="next"'
						},
						body: {}
					};
				});

				it( 'is generated if a "next" header is present', function() {
					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'next' );
						expect( parsedResult._paging.next ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.next._options.endpoint ).to.equal(
							'http://site.com/wp-json/wp/v2/posts?page=3'
						);
					});
				});

				it( 'is generated correctly for requests to explicit endpoints', function() {
					// Testing full URLs as endpoints validates that _paging.next.then works
					wpRequest._options.endpoint = 'http://site.com/wp-json/wp/v2/posts?page=3';
					mockAgent._response.headers.link = '</wp-json/wp/v2/posts?page=4>; rel="next"';

					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'next' );
						expect( parsedResult._paging.next ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.next._options.endpoint ).to.equal(
							'http://site.com/wp-json/wp/v2/posts?page=4'
						);
					});
				});

			});

			describe( '.prev object', function() {

				beforeEach(function() {
					mockAgent._response = {
						headers: {
							'x-wp-totalpages': 4,
							'x-wp-total': 7,
							link: '</wp-json/wp/v2/posts?page=2>; rel="prev"'
						},
						body: {}
					};
				});

				it( 'is generated if a "prev" header is present', function() {
					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'prev' );
						expect( parsedResult._paging.prev ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.prev._options.endpoint ).to.equal(
							'http://site.com/wp-json/wp/v2/posts?page=2'
						);
					});
				});

				it( 'is generated correctly for requests to explicit endpoints', function() {
					// Testing full URLs as endpoints validates that _paging.prev.then works
					wpRequest._options.endpoint = 'http://site.com/wp-json/wp/v2/posts?page=2';
					mockAgent._response.headers.link = '</wp-json/wp/v2/posts?page=1>; rel="prev"';

					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'prev' );
						expect( parsedResult._paging.prev ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.prev._options.endpoint ).to.equal(
							'http://site.com/wp-json/wp/v2/posts?page=1'
						);
					});
				});

			});

		}); // Pagination

	}); // Request methods

	describe( 'deprecated request methods', function() {

		describe( '.post()', function() {

			it( 'is a function', function() {
				expect( request ).to.have.property( 'post' );
				expect( request.post ).to.be.a( 'function' );
			});

			it( 'proxies to ._httpPost', function() {
				sinon.stub( request, '_httpPost' );
				function cb() {}
				request.post( 'foo', cb );
				expect( request._httpPost ).to.have.been.calledWith( 'foo', cb );
				request._httpPost.restore();
			});

		});

		describe( '.put()', function() {

			it( 'is a function', function() {
				expect( request ).to.have.property( 'put' );
				expect( request.put ).to.be.a( 'function' );
			});

			it( 'proxies to ._httpPut', function() {
				sinon.stub( request, '_httpPut' );
				function cb() {}
				request.put( 'foo', cb );
				expect( request._httpPut ).to.have.been.calledWith( 'foo', cb );
				request._httpPut.restore();
			});

		});

	}); // Deprecated request methods

});
