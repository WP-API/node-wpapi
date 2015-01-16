'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
chai.use( require( 'sinon-chai' ) );
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var WPRequest = require( '../../../lib/shared/wp-request' );

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
			expect( request._path ).to.deep.equal( {} );
			expect( request._template ).to.equal( '' );
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

	}); // constructor

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

		it( 'sets the username and password options, if provided', function() {
			expect( request._options ).not.to.have.property( 'username' );
			expect( request._options ).not.to.have.property( 'password' );
			request.auth( 'user', 'pass' );
			expect( request._options ).to.have.property( 'username' );
			expect( request._options ).to.have.property( 'password' );
			expect( request._options.username ).to.equal( 'user' );
			expect( request._options.password ).to.equal( 'pass' );
		});

	}); // auth

	describe( '._auth', function() {

		var mockAgent;

		beforeEach(function() {
			mockAgent = {
				auth: sinon.stub()
			};
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

	describe( 'request methods', function() {

		var MockAgent = require( '../../mocks/mock-superagent' );
		var mockAgent;
		var SandboxedRequest;
		var wpRequest;

		beforeEach(function() {
			mockAgent = new MockAgent();
			SandboxedRequest = sandbox.require( '../../../lib/shared/wp-request', {
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

			it( 'passes data through unchanged if header has no link property', function() {
				mockAgent._response = {
					headers: {
						'x-wp-totalpages': '0',
						'x-wp-total': '0'
					},
					body: 'some object'
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.equal( 'some object' );
					expect( parsedResult ).not.to.have.property( '_paging' );
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
							'</wp-json/posts?page=1>; rel="prev",',
							'</wp-json/posts?page=2>; rel="next",',
							'<http://site.com/wp-json/posts/1024>; rel="item";',
							'title="Article Title",',
							'<http://site.com/wp-json/posts/994>; rel="item";',
							'title="Another Article"'
						].join( ' ' )
					},
					body: {}
				};
				return wpRequest.then(function( parsedResult ) {
					expect( parsedResult ).to.have.property( '_paging' );
					expect( parsedResult._paging ).to.have.property( 'links' );
					expect( parsedResult._paging.links ).to.have.property( 'prev' );
					var expectedPrevLink = '/wp-json/posts?page=1';
					expect( parsedResult._paging.links.prev ).to.equal( expectedPrevLink );
					expect( parsedResult._paging.links ).to.have.property( 'next' );
					var expectedNextLink = '/wp-json/posts?page=2';
					expect( parsedResult._paging.links.next ).to.equal( expectedNextLink );
				});
			});

			describe( '.next object', function() {

				beforeEach(function() {
					mockAgent._response = {
						headers: {
							'x-wp-totalpages': 4,
							'x-wp-total': 7,
							link: '</wp-json/posts?page=3>; rel="next"'
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
							'http://site.com/wp-json/posts?page=3'
						);
					});
				});

				it( 'is generated correctly for requests to explicit endpoints', function() {
					// Testing full URLs as endpoints validates that _paging.next.then works
					wpRequest._options.endpoint = 'http://site.com/wp-json/posts?page=3';
					mockAgent._response.headers.link = '</wp-json/posts?page=4>; rel="next"';

					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'next' );
						expect( parsedResult._paging.next ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.next._options.endpoint ).to.equal(
							'http://site.com/wp-json/posts?page=4'
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
							link: '</wp-json/posts?page=2>; rel="prev"'
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
							'http://site.com/wp-json/posts?page=2'
						);
					});
				});

				it( 'is generated correctly for requests to explicit endpoints', function() {
					// Testing full URLs as endpoints validates that _paging.prev.then works
					wpRequest._options.endpoint = 'http://site.com/wp-json/posts?page=2';
					mockAgent._response.headers.link = '</wp-json/posts?page=1>; rel="prev"';

					return wpRequest.then(function( parsedResult ) {
						expect( parsedResult ).to.have.property( '_paging' );
						expect( parsedResult._paging ).to.have.property( 'prev' );
						expect( parsedResult._paging.prev ).to.be.an.instanceof( SandboxedRequest );
						expect( parsedResult._paging.prev._options.endpoint ).to.equal(
							'http://site.com/wp-json/posts?page=1'
						);
					});
				});

			});

		}); // Pagination

	}); // Request methods
});
