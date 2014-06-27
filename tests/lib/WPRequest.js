'use strict';
var chai = require( 'chai' );
var expect = chai.expect;
chai.use( require( 'sinon-chai' ) );
var sinon = require( 'sinon' );
var sandbox = require( 'sandboxed-module' );

var WPRequest = require( '../../lib/WPRequest' );

describe( 'WPRequest', function() {

	describe( 'constructor', function() {

		it( 'should create a WPRequest instance', function() {
			var request = new WPRequest();
			expect( request instanceof WPRequest ).to.be.true;
		});

		it( 'should set any passed-in options', function() {
			var request = new WPRequest({
				booleanProp: true,
				strProp: 'Some string'
			});
			expect( request._options.booleanProp ).to.be.true;
			expect( request._options.strProp ).to.equal( 'Some string' );
		});

		it( 'should define a _supportedMethods array', function() {
			var request = new WPRequest();
			var _supportedMethods = request._supportedMethods.sort().join( '|' );
			expect( _supportedMethods ).to.equal( 'delete|get|head|patch|post|put' );
		});

	});

	describe( '_checkMethodSupport', function() {

		it( 'should return true when called with a supported method', function() {
			var query = new WPRequest();
			expect( query._checkMethodSupport( 'get' ) ).to.equal( true );
		});

		it( 'should throw an error when called with an unsupported method', function() {
			var query = new WPRequest();
			query._supportedMethods = [ 'get' ];

			expect(function() {
				return query._checkMethodSupport( 'post' );
			}).to.throw();
		});

	});

	describe( 'request methods', function() {

		var MockAgent = require( '../mocks/mock-superagent' );
		var mockAgent;
		var SandboxedRequest;
		var wpRequest;

		beforeEach(function() {
			mockAgent = new MockAgent();
			SandboxedRequest = sandbox.require( '../../lib/WPRequest', {
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
				mockAgent._response = { body: 'data' };

				wpRequest.get( spy );

				expect( spy ).to.have.been.calledOnce;
				expect( spy ).to.have.been.calledWith( null, 'data' );
			});

			it( 'should return a Promise to the request data', function() {
				mockAgent._response = { body: 'data' };
				return wpRequest.get().then(function( data ) {
					expect( data ).to.equal( 'data' );
				});
			});

		});

		describe( '.then()', function() {

			it( 'should invoke GET and pass the results to the provided callback', function() {
				mockAgent._response = { body: 'data' };
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

		});

		describe( '.post()', function() {

			it( 'should trigger an HTTP POST request', function() {
				sinon.spy( mockAgent, 'post' );
				sinon.spy( mockAgent, 'set' );
				sinon.spy( mockAgent, 'send' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';
				var data = { some: 'data' };

				wpRequest.post( data );

				expect( mockAgent.post ).to.have.been.calledOnce;
				expect( mockAgent.post ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.set ).to.have.been.calledOnce;
				expect( mockAgent.set ).to.have.been.calledWith( 'Authorization', 'user:pass' );
				expect( mockAgent.send ).to.have.been.calledOnce;
				expect( mockAgent.send ).to.have.been.calledWith( data );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				var data = { some: 'data' };
				mockAgent._response = { body: 'some data' };

				wpRequest.post( data, spy );

				expect( spy ).to.have.been.calledOnce;
				expect( spy ).to.have.been.calledWith( null, 'some data' );
			});

			it( 'should return a Promise to the request response', function() {
				mockAgent._response = { body: 'resp' };
				var data = { some: 'data' };
				return wpRequest.post( data ).then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		});

		describe( '.put()', function() {

			it( 'should trigger an HTTP PUT request', function() {
				sinon.spy( mockAgent, 'put' );
				sinon.spy( mockAgent, 'set' );
				sinon.spy( mockAgent, 'send' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';
				var data = { some: 'data' };

				wpRequest.put( data );

				expect( mockAgent.put ).to.have.been.calledOnce;
				expect( mockAgent.put ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.set ).to.have.been.calledOnce;
				expect( mockAgent.set ).to.have.been.calledWith( 'Authorization', 'user:pass' );
				expect( mockAgent.send ).to.have.been.calledOnce;
				expect( mockAgent.send ).to.have.been.calledWith( data );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				var data = { some: 'data' };
				mockAgent._response = { body: 'some data' };

				wpRequest.put( data, spy );

				expect( spy ).to.have.been.calledOnce;
				expect( spy ).to.have.been.calledWith( null, 'some data' );
			});

			it( 'should return a Promise to the request data', function() {
				mockAgent._response = { body: 'resp' };
				var data = { some: 'data' };
				return wpRequest.put( data ).then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		});

		describe( '.delete()', function() {

			it( 'should trigger an HTTP DELETE request', function() {
				sinon.spy( mockAgent, 'del' );
				sinon.spy( mockAgent, 'set' );
				sinon.stub( mockAgent, 'end' );

				wpRequest._options.username = 'user';
				wpRequest._options.password = 'pass';

				wpRequest.delete();

				expect( mockAgent.del ).to.have.been.calledOnce;
				expect( mockAgent.del ).to.have.been.calledWith( 'url/' );
				expect( mockAgent.set ).to.have.been.calledOnce;
				expect( mockAgent.set ).to.have.been.calledWith( 'Authorization', 'user:pass' );
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				mockAgent._response = { body: 'some data' };

				wpRequest.delete( spy );

				expect( spy ).to.have.been.calledOnce;
				expect( spy ).to.have.been.calledWith( null, 'some data' );
			});

			it( 'should return a Promise to the body of the request data', function() {
				mockAgent._response = { body: 'resp' };
				return wpRequest.delete().then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		});

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

				wpRequest.head( spy );

				expect( spy ).to.have.been.calledOnce;
				expect( spy ).to.have.been.calledWith( null, 'some headers' );
			});

			it( 'should return a Promise to the headers from the response', function() {
				mockAgent._response = { headers: 'resp' };
				return wpRequest.head().then(function( resp ) {
					expect( resp ).to.equal( 'resp' );
				});
			});

		});

	});

});
