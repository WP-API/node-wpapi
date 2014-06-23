const chai = require( 'chai' );
const expect = chai.expect;
chai.use( require( 'sinon-chai' ) );
const sinon = require( 'sinon' );
const sandbox = require( 'sandboxed-module' );

const WPRequest = require( '../../lib/WPRequest' );

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

		it( 'should define a _filters object', function() {
			var request = new WPRequest();
			expect( request._filters ).to.deep.equal({});
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

	describe( 'prototype.filter', function() {
		var request;

		beforeEach(function() {
			request = new WPRequest();
		});

		it( 'should set the internal _filters hash', function() {
			request.filter({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7
			});
		});

		it( 'should support passing a single filter property as key & value arguments', function() {
			request.filter( 'postType', 'page' );
			expect( request._filters ).to.deep.equal({
				postType: 'page'
			});
		});

		it( 'should support redefining filter values', function() {
			request.filter( 'postStatus', 'draft' );
			request.filter( 'postStatus', 'publish' );
			expect( request._filters.postStatus ).to.equal( 'publish' );
		});

		it( 'should support chaining filters', function() {
			request.filter({
				someFilterProp: 'filter-value'
			}).filter({
				postsPerPage: 7
			}).filter( 'postStatus', 'draft' );
			expect( request._filters ).to.deep.equal({
				someFilterProp: 'filter-value',
				postsPerPage: 7,
				postStatus: 'draft'
			});
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
				endpoint: 'endpoint'
			});
		});

		describe( '.get()', function() {

			it( 'should trigger an HTTP GET request', function() {
				sinon.spy( mockAgent, 'get' );
				sinon.stub( mockAgent, 'end' );

				wpRequest.get();

				expect( mockAgent.get ).to.have.been.calledWith( 'endpoint' );
				expect( mockAgent.end ).to.have.been.called;
			});

			it( 'should invoke a callback, if provided', function() {
				var spy = sinon.spy();
				mockAgent._response = { body: 'data' };

				wpRequest.get( spy );

				expect( spy ).to.have.been.calledWith( null, 'data' );
			});

			it( 'should return a Promise to the request data', function() {
				mockAgent._response = { body: 'data' };
				return wpRequest.get().then(function( data ) {
					expect( data ).to.equal( 'data' );
				});
			});

		});

		describe( '.post()', function() {

			it( 'should trigger an HTTP POST request', function() {});

			it( 'should invoke a callback, if provided', function() {});

			it( 'should return a Promise to the request data', function() {});

		});

		describe( '.put()', function() {

			it( 'should trigger an HTTP PUT request', function() {});

			it( 'should invoke a callback, if provided', function() {});

			it( 'should return a Promise to the request data', function() {});

		});

		describe( '.delete()', function() {

			it( 'should trigger an HTTP DELETE request', function() {});

			it( 'should invoke a callback, if provided', function() {});

			it( 'should return a Promise to the request data', function() {});

		});

	});

});
